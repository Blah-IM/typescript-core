import canonicalize from "./canonicalize.ts";
import { BlahPublicKey } from "./publicKey.ts";
import type { BlahPayloadSignee, BlahSignedPayload } from "./signedPayload.ts";
import { bufToHex } from "./utils.ts";

export type EncodedBlahKeyPair = {
  v: "0";
  id: string;
  privateKey: JsonWebKey;
};

export class BlahKeyPair {
  publicKey: BlahPublicKey;
  private privateKey: CryptoKey;

  get id() {
    return this.publicKey.id;
  }
  get name() {
    return this.publicKey.name;
  }

  private constructor(
    publicIdentity: BlahPublicKey,
    privateKey: CryptoKey,
  ) {
    this.publicKey = publicIdentity;
    this.privateKey = privateKey;
  }

  static async generate(): Promise<BlahKeyPair> {
    const { publicKey, privateKey } = await crypto.subtle.generateKey(
      "Ed25519",
      true,
      [
        "sign",
        "verify",
      ],
    ) as CryptoKeyPair;
    const publicIdentity = await BlahPublicKey.fromPublicKey(publicKey);
    return new BlahKeyPair(publicIdentity, privateKey);
  }

  static async fromEncoded(encoded: EncodedBlahKeyPair): Promise<BlahKeyPair> {
    if (encoded.v !== "0") {
      throw new Error("Unsupported version");
    }
    const publicIdentity = await BlahPublicKey.fromID(encoded.id);
    const privateKey = await crypto.subtle.importKey(
      "jwk",
      encoded.privateKey,
      { name: "Ed25519" },
      true,
      ["sign"],
    );

    return new BlahKeyPair(publicIdentity, privateKey);
  }

  async encode(): Promise<EncodedBlahKeyPair> {
    return {
      v: "0",
      id: this.publicKey.id,
      privateKey: await crypto.subtle.exportKey("jwk", this.privateKey),
    };
  }

  async signPayload<P>(
    payload: P,
    date: Date = new Date(),
    identityKeyId?: string,
  ): Promise<BlahSignedPayload<P>> {
    const nonceBuf = new Uint32Array(1);
    crypto.getRandomValues(nonceBuf);

    const timestamp = Math.floor(date.getTime() / 1000);

    const signee: BlahPayloadSignee<P> = {
      nonce: nonceBuf[0],
      payload,
      timestamp,
      id_key: identityKeyId ?? this.id,
    };
    if (identityKeyId) {
      signee.act_key = this.id;
    }

    const signeeBytes = new TextEncoder().encode(canonicalize(signee));

    const rawSig = await crypto.subtle.sign(
      "Ed25519",
      this.privateKey,
      signeeBytes,
    );
    return {
      sig: bufToHex(rawSig),
      signee,
    };
  }
}
