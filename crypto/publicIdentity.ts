import canonicalize from "./canonicalize.ts";
import type { BlahSignedPayload } from "./signedPayload.ts";
import { bufToHex, hexToBuf } from "./utils.ts";

export class BlahPublicIdentity {
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
  ): Promise<BlahPublicIdentity> {
    const rawKey = await crypto.subtle.exportKey("raw", publicKey);
    const id = bufToHex(rawKey);
    return new BlahPublicIdentity(publicKey, id);
  }

  static async fromID(id: string): Promise<BlahPublicIdentity> {
    const rawKey = hexToBuf(id);
    const publicKey = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "Ed25519" },
      true,
      [
        "verify",
      ],
    );
    return new BlahPublicIdentity(publicKey, id);
  }

  static async verifyPayload<P>(
    signedPayload: BlahSignedPayload<P>,
  ): Promise<{ payload: P; identity: BlahPublicIdentity }> {
    const { signee } = signedPayload;
    const identity = await BlahPublicIdentity.fromID(signee.user);
    return { payload: await identity.verifyPayload(signedPayload), identity };
  }

  async verifyPayload<P>(signedPayload: BlahSignedPayload<P>): Promise<P> {
    const { sig, signee } = signedPayload;
    if (signee.user !== this.id) {
      throw new Error(
        `Payload is not signed by this identity. Was signed by ${signee.user}.`,
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
