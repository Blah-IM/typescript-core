import type z from "zod";
import canonicalize from "./canonicalize.ts";
import {
  type BlahSignedPayload,
  blahSignedPayloadSchemaOf,
} from "./signedPayload.ts";
import { bufToHex, hexToBuf } from "./utils.ts";

export class BlahPublicKey {
  private publicKey: CryptoKey;
  id: string;
  name: string;

  private constructor(publicKey: CryptoKey, id: string) {
    this.publicKey = publicKey;
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

  static async verifyPayload<P>(
    signedPayload: BlahSignedPayload<P>,
  ): Promise<{ payload: P; key: BlahPublicKey }> {
    const { signee } = signedPayload;
    const key = await BlahPublicKey.fromID(signee.act_key ?? signee.id_key);
    return { payload: await key.verifyPayload(signedPayload), key };
  }

  static async parseAndVerifyPayload<P extends z.ZodTypeAny>(
    schema: P,
    signedPayload: unknown,
  ): Promise<{ payload: P; key: BlahPublicKey }> {
    const signedPayloadSchema = blahSignedPayloadSchemaOf(schema);
    const parsed = signedPayloadSchema.parse(signedPayload) as z.infer<P>;
    return await BlahPublicKey.verifyPayload(parsed);
  }

  async verifyPayload<P>(signedPayload: BlahSignedPayload<P>): Promise<P> {
    const { sig, signee } = signedPayload;
    const signingKey = signee.act_key;
    if (signingKey !== this.id) {
      throw new Error(
        `Payload is not signed by this public key. Was signed by ${signingKey}.`,
      );
    }
    const signeeBytes = new TextEncoder().encode(canonicalize(signee));
    const result = await crypto.subtle.verify(
      "Ed25519",
      this.publicKey,
      hexToBuf(sig),
      signeeBytes,
    );
    if (!result) {
      throw new Error("Invalid signature");
    }
    return signee.payload;
  }
}
