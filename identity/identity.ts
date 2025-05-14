import {
  BlahKeyPair,
  BlahPublicKey,
  type BlahSignedPayload,
  type SignOrVerifyOptions,
} from "../crypto/mod.ts";
import { type ActKeyUpdate, BlahActKey } from "./actKey.ts";
import { blahIdentityDescriptionSchema } from "./identityDescription.ts";
import type { BlahIdentityDescription } from "./mod.ts";
import { type BlahProfile, blahProfileSchema } from "./profile.ts";

/**
 * Object representing an identity.
 *
 * This object manages the identity's ID key and acting keys, as well as the profile.
 *
 * There are 3 major configurations this object can be in:
 * - *Full Access*: Private key of ID key is available. All methods are available.
 * - *Limited Access*: Private key of (at least) one act key is avilable. Key management methods are unavailable.
 * - *Read Only*: No private keys are available. Only inspection & integrity verification are available.
 */
export class BlahIdentity {
  private internalIdKey: BlahPublicKey | BlahKeyPair;
  private internalActKeys: BlahActKey[];
  private rawProfile: BlahSignedPayload<BlahProfile>;
  private internalProfileSigValid: boolean;

  private constructor(
    internalIdKey: BlahPublicKey | BlahKeyPair,
    internalActKeys: BlahActKey[],
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

  get actKeys(): BlahActKey[] {
    return this.internalActKeys;
  }

  get actingKey(): BlahActKey | undefined {
    return this.internalActKeys.find((k) => k.canSign);
  }

  static async fromIdentityDescription(
    identityDesc: unknown,
    idKeyPair?: BlahKeyPair,
    actingKeyPair?: BlahKeyPair,
  ): Promise<BlahIdentity> {
    let identityDescJson = identityDesc;
    if (typeof identityDesc === "string") {
      identityDescJson = JSON.parse(identityDesc);
    }
    const { id_key, act_keys, profile } = blahIdentityDescriptionSchema.parse(
      identityDescJson,
    );

    const idKey = idKeyPair ?? await BlahPublicKey.fromID(id_key);
    if (idKey.id !== id_key) {
      throw new Error(
        "ID key pair does not match ID key in identity description.",
      );
    }
    const idKeyPublic = idKey instanceof BlahKeyPair ? idKey.publicKey : idKey;

    const actKeys: BlahActKey[] = await Promise.all(
      act_keys.map(async (raw) => {
        const actKey = await BlahActKey.fromSignedRecord(raw, idKeyPublic);
        if (actingKeyPair?.id === actKey.publicKey.id) {
          actKey.setKeyPair(actingKeyPair);
        }
        return actKey;
      }),
    );

    const rawProfile = profile;
    const profileSigningKey = actKeys.find((k) =>
      k.publicKey.id === profile.signee.act_key
    );

    let profileSigValid = false;
    if (profileSigningKey && rawProfile.signee.id_key === idKey.id) {
      try {
        await profileSigningKey.verifyPayload(rawProfile);
        profileSigValid = true;
      } catch {
        profileSigValid = false;
      }
    }

    return new BlahIdentity(idKey, actKeys, rawProfile, profileSigValid);
  }

  static async create(
    idKeyPair: BlahKeyPair,
    firstActKeyPair: BlahKeyPair,
    profile: BlahProfile,
    firstActKeyConfig?: ActKeyUpdate,
  ): Promise<BlahIdentity> {
    const actKey = await BlahActKey.create(
      firstActKeyPair,
      idKeyPair,
      firstActKeyConfig,
    );

    const parsedProfile = blahProfileSchema.parse(profile);
    const profileRecord = await actKey.signPayload(parsedProfile);

    return new BlahIdentity(idKeyPair, [actKey], profileRecord, true);
  }

  generateIdentityDescription(): BlahIdentityDescription {
    return blahIdentityDescriptionSchema.parse(
      {
        id_key: this.idPublicKey.id,
        act_keys: this.internalActKeys.map((k) => k.toSignedRecord()),
        profile: this.rawProfile,
      } satisfies BlahIdentityDescription,
    );
  }

  async addActKey(actKey: BlahKeyPair | BlahPublicKey, config?: ActKeyUpdate) {
    if (this.internalIdKey instanceof BlahPublicKey) {
      throw new Error("Cannot add act key to identity without ID key pair.");
    }

    const key = await BlahActKey.create(actKey, this.internalIdKey, config);
    this.internalActKeys.push(key);
  }

  async updateActKey(id: string, update: ActKeyUpdate) {
    if (this.internalIdKey instanceof BlahPublicKey) {
      throw new Error("Cannot update act key in identity without ID key pair.");
    }

    const key = this.internalActKeys.find((k) => k.publicKey.id === id);
    if (!key) {
      throw new Error("Act key not found in identity.");
    }
    await key.update(update, this.internalIdKey);
  }

  /** Sign a payload with the acting key. */
  signPayload<P>(
    payload: P,
    options?: Omit<SignOrVerifyOptions, "identityKeyId">,
  ): Promise<BlahSignedPayload<P>> {
    if (!this.actingKey) throw new Error("No act key to sign payload with.");

    return this.actingKey.signPayload(payload, options);
  }

  async updateProfile(profile: BlahProfile) {
    this.rawProfile = await this.signPayload(profile);
    this.internalProfileSigValid = true;
  }
}
