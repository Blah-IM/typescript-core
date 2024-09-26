import {
  BlahKeyPair,
  BlahPublicKey,
  BlahSignedPayload,
} from "../crypto/mod.ts";
import type { BlahActKeyRecord } from "./actKey.ts";
import { blahIdentityFileSchema } from "./identityFile.ts";
import type { BlahProfile } from "./profile.ts";

type ActKey = {
  raw: BlahSignedPayload<BlahActKeyRecord>;
  key: BlahPublicKey | BlahKeyPair;
  expiresAt: Date;
  sigValid: boolean;
};

async function constructActKeyFromRaw(
  raw: BlahSignedPayload<BlahActKeyRecord>,
  idKey: BlahPublicKey | BlahKeyPair,
): Promise<ActKey> {
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

export class BlahIdentity {
  idKey: BlahPublicKey | BlahKeyPair;
  actKeys: ActKey[];
  rawProfile: BlahSignedPayload<BlahProfile>;
  profileSigValid: boolean;

  private constructor(
    idKey: BlahPublicKey | BlahKeyPair,
    actKeys: ActKey[],
    rawProfile: BlahSignedPayload<BlahProfile>,
    profileSigValid: boolean,
  ) {
    this.idKey = idKey;
    this.actKeys = actKeys;
    this.rawProfile = rawProfile;
    this.profileSigValid = profileSigValid;
  }

  get profile(): BlahProfile {
    return this.rawProfile.signee.payload;
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

    const actKeys: ActKey[] = await Promise.all(act_keys.map(async (raw) => {
      const actKey = await constructActKeyFromRaw(raw, idKey);
      if (actingKeyPair?.id === actKey.key.id) {
        actKey.key = actingKeyPair;
      }
      return actKey;
    }));

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
}
