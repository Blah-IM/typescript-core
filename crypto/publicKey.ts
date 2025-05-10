import type z from "zod";
import {
  type BlahSignedPayload,
  blahSignedPayloadSchemaOf,
} from "./signedPayload.ts";
import { bufToHex, hexToBuf } from "./utils.ts";
import { type SignOrVerifyOptions, verifyPayload } from "./signAndVerify.ts";

export class BlahPublicKey {
  private internalPublicKey: CryptoKey;
  id: string;
  name: string;

  get publicKey(): CryptoKey {
    return this.internalPublicKey;
  }

  private constructor(publicKey: CryptoKey, id: string) {
    this.internalPublicKey = publicKey;
    this.id = id;
    // First 4 and last 4 characters of the id
    this.name = id.slice(0, 4) + "..." + id.slice(-4);
  }

  static async fromPublicKey(
    publicKey: CryptoKey,
  ): Promise<BlahPublicKey> {
    const rawKey = await crypto.subtle.exportKey("raw", publicKey);
    const id = bufToHex(rawKey);
    return new BlahPublicKey(publicKey, id);
  }

  static async fromID(id: string): Promise<BlahPublicKey> {
    const rawKey = hexToBuf(id);
    const publicKey = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "Ed25519" },
      true,
      ["verify"],
    );
    return new BlahPublicKey(publicKey, id);
  }

  /**
   * Verify a signed payload with the act key in the signed payload.
   *
   * This method is a convenience method that calls {@link verifyPayload} with the act key in the signed payload.
   */
  static async verifyPayload<P>(
    signedPayload: BlahSignedPayload<P>,
    options: SignOrVerifyOptions = {},
  ): Promise<{ payload: P; key: BlahPublicKey }> {
    const { signee } = signedPayload;
    const key = await BlahPublicKey.fromID(signee.act_key);
    return { payload: await key.verifyPayload(signedPayload, options), key };
  }

  /**
   * Parse and verify a signed payload with the given schema, against the act key in the signed payload.
   *
   * This method is a convenience method that calls {@link verifyPayload} with the act key in the signed payload.
   */
  static async parseAndVerifyPayload<P extends z.ZodTypeAny>(
    schema: P,
    signedPayload: unknown,
    options: SignOrVerifyOptions = {},
  ): Promise<{ payload: z.infer<P>; key: BlahPublicKey }> {
    const signedPayloadSchema = blahSignedPayloadSchemaOf(schema);
    const parsed = signedPayloadSchema.parse(signedPayload) as z.infer<P>;
    return await BlahPublicKey.verifyPayload(parsed, options);
  }

  /**
   * Verify a signed payload with this public key.
   *
   * This method is a convenience method that calls {@link verifyPayload} with this public key.
   */
  verifyPayload<P>(
    signedPayload: BlahSignedPayload<P>,
    options: SignOrVerifyOptions = {},
  ): Promise<P> {
    return verifyPayload(this, signedPayload, options);
  }
}
