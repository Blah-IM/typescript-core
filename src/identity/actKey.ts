import { z } from "zod/v4";
import { BlahPublicKey } from "../crypto/publicKey.ts";
import { BlahKeyPair } from "../crypto/keypair.ts";
import type { BlahSignedPayload } from "../crypto/signedPayload.ts";
import type { SignOrVerifyOptions } from "../crypto/signAndVerify.ts";

export const blahActKeyRecordSchema = z.object({
  typ: z.literal("user_act_key"),
  act_key: z.string(),
  expire_time: z.int(),
  comment: z.string(),
});

export type BlahActKeyRecord = {
  typ: "user_act_key";
  act_key: string;
  expire_time: number;
  comment: string;
};

export type ActKeyUpdate = {
  expiresAt?: Date;
  comment?: string;
};

export class BlahActKey {
  private internalKey: BlahPublicKey | BlahKeyPair;
  private internalExpiresAt: Date;
  private internalComment: string;
  private internalIdKeyPublic: BlahPublicKey;
  private internalSigValid: boolean;
  private internalSignedRecord: BlahSignedPayload<BlahActKeyRecord>;

  private constructor(
    key: BlahPublicKey | BlahKeyPair,
    idKeyPublic: BlahPublicKey,
    fullConfig: Required<ActKeyUpdate>,
    sigValid: boolean,
    signedRecord: BlahSignedPayload<BlahActKeyRecord>,
  ) {
    this.internalKey = key;
    this.internalIdKeyPublic = idKeyPublic;
    this.internalExpiresAt = fullConfig.expiresAt;
    this.internalComment = fullConfig.comment;
    this.internalSigValid = sigValid;
    this.internalSignedRecord = signedRecord;
  }

  static async fromSignedRecord(
    raw: BlahSignedPayload<BlahActKeyRecord>,
    idKeyPublic: BlahPublicKey,
    keypair?: BlahKeyPair,
  ): Promise<BlahActKey> {
    let record: BlahActKeyRecord;
    let sigValid = false;
    try {
      record = await idKeyPublic.verifyPayload(raw);
      sigValid = true;
    } catch {
      record = raw.signee.payload;
      sigValid = false;
    }

    const key: BlahPublicKey | BlahKeyPair =
      keypair ?? (await BlahPublicKey.fromID(record.act_key));
    const fullConfig: Required<ActKeyUpdate> = {
      expiresAt: new Date(record.expire_time * 1000),
      comment: record.comment,
    };

    return new BlahActKey(key, idKeyPublic, fullConfig, sigValid, raw);
  }

  static async create(
    key: BlahPublicKey | BlahKeyPair,
    idKeyPair: BlahKeyPair,
    config?: ActKeyUpdate,
  ): Promise<BlahActKey> {
    const fullConfig: Required<ActKeyUpdate> = {
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      comment: "",
      ...config,
    };
    const record: BlahActKeyRecord = {
      typ: "user_act_key",
      act_key: key.id,
      expire_time: Math.floor(fullConfig.expiresAt.getTime() / 1000),
      comment: fullConfig.comment,
    };

    const signedRecord = await idKeyPair.signPayload(record);

    return new BlahActKey(
      key,
      idKeyPair.publicKey,
      fullConfig,
      true,
      signedRecord,
    );
  }

  get expiresAt(): Date {
    return this.internalExpiresAt;
  }

  get isExpired(): boolean {
    return new Date() > this.internalExpiresAt;
  }

  get isSigValid(): boolean {
    return this.internalSigValid;
  }

  get comment(): string {
    return this.internalComment;
  }

  get canSign(): boolean {
    return this.internalKey instanceof BlahKeyPair;
  }

  get publicKey(): BlahPublicKey {
    if (this.internalKey instanceof BlahKeyPair) {
      return this.internalKey.publicKey;
    } else {
      return this.internalKey;
    }
  }

  /**
   * Sign a payload with this act key.
   *
   * This method is a convenience method that calls {@link signPayload} with this act key.
   * Correct identity key ID is automatically set.
   *
   * @param payload The payload to sign.
   * @param options Options for signing.
   */
  async signPayload<P>(
    payload: P,
    options: Omit<SignOrVerifyOptions, "identityKeyId"> = {},
  ): Promise<BlahSignedPayload<P>> {
    if (!this.canSign) throw new Error("Cannot sign without a private key");

    return await (this.internalKey as BlahKeyPair).signPayload(payload, {
      ...options,
      identityKeyId: this.internalIdKeyPublic.id,
    });
  }

  /**
   * Verify a signed payload with this act key.
   *
   * This method is a convenience method that calls {@link verifyPayload} with this act key.
   * But this method also checks if the key was expired at the time of signing.
   *
   * @param payload The signed payload to verify.
   */
  async verifyPayload<P>(payload: BlahSignedPayload<P>): Promise<P> {
    if (new Date(payload.signee.timestamp * 1000) > this.internalExpiresAt) {
      throw new Error("Key was expired at the time of signing");
    }
    return await this.internalKey.verifyPayload(payload, {
      identityKeyId: this.internalIdKeyPublic.id,
    });
  }

  async update(update: ActKeyUpdate, idKeyPair: BlahKeyPair): Promise<void> {
    if (update.expiresAt) this.internalExpiresAt = update.expiresAt;
    if (update.comment) this.internalComment = update.comment;

    this.internalSignedRecord = await idKeyPair.signPayload({
      typ: "user_act_key",
      act_key: this.internalKey.id,
      expire_time: Math.floor(this.internalExpiresAt.getTime() / 1000),
      comment: this.internalComment,
    });
    this.internalSigValid = true;
  }

  toSignedRecord(): BlahSignedPayload<BlahActKeyRecord> {
    return this.internalSignedRecord;
  }

  setKeyPair(keypair: BlahKeyPair) {
    if (this.internalKey.id !== keypair.id) throw new Error("Key ID mismatch");
    this.internalKey = keypair;
  }
}
