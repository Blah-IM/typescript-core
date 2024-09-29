import {
  BlahKeyPair,
  BlahPublicKey,
  type BlahSignedPayload,
} from "../crypto/mod.ts";
import { type BlahActKeyRecord, blahActKeyRecordSchema } from "./actKey.ts";
import { blahIdentityFileSchema } from "./identityFile.ts";
import { BlahIdentityFile } from "./mod.ts";
import type { BlahProfile } from "./profile.ts";

type InternalActKey = {
  raw: BlahSignedPayload<BlahActKeyRecord>;
  key: BlahPublicKey | BlahKeyPair;
  expiresAt: Date;
  sigValid: boolean;
};

type ActKey = {
  publicKey: BlahPublicKey;
  expiresAt: Date;
  sigValid: boolean;
  comment: string;
};

type ActKeyConfig = Partial<Omit<ActKey, "publicKey" | "sigValid">>;

async function constructActKeyFromRaw(
  raw: BlahSignedPayload<BlahActKeyRecord>,
  idKey: BlahPublicKey | BlahKeyPair,
): Promise<InternalActKey> {
  const publicKey = idKey instanceof BlahKeyPair ? idKey.publicKey : idKey;
  let sigValid = false;
  try {
    publicKey.verifyPayload(raw);
    sigValid = true;
  } catch {
    sigValid = false;
  }

  const key = await BlahPublicKey.fromID(raw.signee.payload.act_key);
  const expiresAt = new Date(raw.signee.payload.expire_time * 1000);
  return { raw, key, expiresAt, sigValid };
}

async function constructInternalActKey(
  idKeyPair: BlahKeyPair,
  key: BlahPublicKey | BlahKeyPair,
  config?: ActKeyConfig,
): Promise<InternalActKey> {
  const actKey: ActKey = {
    publicKey: key instanceof BlahKeyPair ? key.publicKey : key,
    expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
    sigValid: true,
    comment: "",
    ...config,
  };

  const rawRecord = await idKeyPair
    .signPayload(blahActKeyRecordSchema.parse(
      {
        typ: "user_act_key",
        expire_time: Math.floor(actKey.expiresAt.getTime() / 1000),
        comment: actKey.comment,
        act_key: actKey.publicKey.id,
      } satisfies BlahActKeyRecord,
    ));

  const internalActKey: InternalActKey = {
    raw: rawRecord,
    key,
    expiresAt: actKey.expiresAt,
    sigValid: true,
  };

  return internalActKey;
}

export class BlahIdentity {
  private internalIdKey: BlahPublicKey | BlahKeyPair;
  private internalActKeys: InternalActKey[];
  private rawProfile: BlahSignedPayload<BlahProfile>;
  private internalProfileSigValid: boolean;

  private constructor(
    internalIdKey: BlahPublicKey | BlahKeyPair,
    internalActKeys: InternalActKey[],
    rawProfile: BlahSignedPayload<BlahProfile>,
    internalProfileSigValid: boolean,
  ) {
    this.internalIdKey = internalIdKey;
    this.internalActKeys = internalActKeys;
    this.rawProfile = rawProfile;
    this.internalProfileSigValid = internalProfileSigValid;
  }

  get profileSigValid(): boolean {
    return this.internalProfileSigValid;
  }

  get profile(): BlahProfile {
    return this.rawProfile.signee.payload;
  }

  get idPublicKey(): BlahPublicKey {
    return this.internalIdKey instanceof BlahKeyPair
      ? this.internalIdKey.publicKey
      : this.internalIdKey;
  }

  get actKeys(): ActKey[] {
    return this.internalActKeys.map(({ key, expiresAt, sigValid, raw }) => ({
      publicKey: key instanceof BlahKeyPair ? key.publicKey : key,
      expiresAt,
      sigValid,
      comment: raw.signee.payload.comment,
    }));
  }

  static async fromIdentityFile(
    identityFile: unknown,
    idKeyPair?: BlahKeyPair,
    actingKeyPair?: BlahKeyPair,
  ): Promise<BlahIdentity> {
    let identityFileJson = identityFile;
    if (typeof identityFile === "string") {
      identityFileJson = JSON.parse(identityFile);
    }
    const { id_key, act_keys, profile } = blahIdentityFileSchema.parse(
      identityFileJson,
    );

    const idKey = idKeyPair ?? await BlahPublicKey.fromID(id_key);
    if (idKey.id !== id_key) {
      throw new Error("ID key pair does not match ID key in identity file.");
    }

    const actKeys: InternalActKey[] = await Promise.all(
      act_keys.map(async (raw) => {
        const actKey = await constructActKeyFromRaw(raw, idKey);
        if (actingKeyPair?.id === actKey.key.id) actKey.key = actingKeyPair;
        return actKey;
      }),
    );

    const rawProfile = profile;
    const profileSigningKey = await BlahPublicKey.fromID(
      rawProfile.signee.act_key,
    );
    if (actKeys.findIndex((k) => k.key.id === profileSigningKey.id) === -1) {
      throw new Error("Profile is not signed by any of the act keys.");
    }
    let profileSigValid = false;
    try {
      profileSigningKey.verifyPayload(rawProfile);
      profileSigValid = true;
    } catch {
      profileSigValid = false;
    }

    return new BlahIdentity(idKey, actKeys, rawProfile, profileSigValid);
  }

  static async create(
    idKeyPair: BlahKeyPair,
    firstActKey: BlahKeyPair,
    profile: BlahProfile,
    firstActKeyConfig?: ActKeyConfig,
  ): Promise<BlahIdentity> {
    const internalActKey = await constructInternalActKey(
      idKeyPair,
      firstActKey,
      firstActKeyConfig,
    );

    const profileRecord: BlahSignedPayload<BlahProfile> = await firstActKey
      .signPayload(profile);

    return new BlahIdentity(
      idKeyPair,
      [internalActKey],
      profileRecord,
      true,
    );
  }

  generateIdentityFile(): BlahIdentityFile {
    return blahIdentityFileSchema.parse(
      {
        id_key: this.idPublicKey.id,
        act_keys: this.internalActKeys.map((k) => (k.raw)),
        profile: this.rawProfile,
      } satisfies BlahIdentityFile,
    );
  }

  async addActKey(actKey: BlahKeyPair | BlahPublicKey, config?: ActKeyConfig) {
    if (this.internalIdKey instanceof BlahPublicKey) {
      throw new Error("Cannot add act key to identity without ID key pair.");
    }

    const internalActKey = await constructInternalActKey(
      this.internalIdKey,
      actKey,
      config,
    );

    this.internalActKeys.push(internalActKey);
  }

  async updateActKey(
    keyId: string,
    config: ActKeyConfig,
  ) {
    if (this.internalIdKey instanceof BlahPublicKey) {
      throw new Error("Cannot update act key in identity without ID key pair.");
    }

    const actKeyIndex = this.internalActKeys.findIndex(
      (k) => k.key.id === keyId,
    );
    if (actKeyIndex === -1) {
      throw new Error("Act key not found in identity.");
    }

    this.internalActKeys[actKeyIndex] = await constructInternalActKey(
      this.internalIdKey,
      this.internalActKeys[actKeyIndex].key,
      config,
    );
  }
}
