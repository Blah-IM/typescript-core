import canonicalize from "./canonicalize.ts";
import { hexToBuf } from "./mod.ts";
import { pbkdf2Key } from "./pbkdf2.ts";
import { BlahPublicKey } from "./publicKey.ts";
import type { BlahPayloadSignee, BlahSignedPayload } from "./signedPayload.ts";
import { bufToHex } from "./utils.ts";

export type EncodedBlahKeyPair =
  & {
    v: "0";
    id: string;
  }
  & ({
    privateKey: JsonWebKey;
  } | {
    passwordProtectedPrivateKey: string;
    iv: string;
    salt: string;
  });

export class BlahKeyPair {
  publicKey: BlahPublicKey;
  private privateKey: CryptoKey;

  get id(): string {
    return this.publicKey.id;
  }
  get name(): string {
    return this.publicKey.name;
  }

  private constructor(
    publicIdentity: BlahPublicKey,
    privateKey: CryptoKey,
  ) {
    this.publicKey = publicIdentity;
    this.privateKey = privateKey;
  }

  static async generate(extractable: boolean = true): Promise<BlahKeyPair> {
    const { publicKey, privateKey } = await crypto.subtle.generateKey(
      "Ed25519",
      extractable,
      ["sign", "verify"],
    ) as CryptoKeyPair;
    const publicIdentity = await BlahPublicKey.fromPublicKey(publicKey);
    return new BlahKeyPair(publicIdentity, privateKey);
  }

  static async fromEncoded(
    encoded: EncodedBlahKeyPair,
    password?: string,
  ): Promise<BlahKeyPair> {
    if (encoded.v !== "0") {
      throw new Error("Unsupported version");
    }

    const publicIdentity = await BlahPublicKey.fromID(encoded.id);

    if ("passwordProtectedPrivateKey" in encoded) {
      if (!password) {
        throw new Error("Private key is password-protected.");
      }

      const derviedKey = await pbkdf2Key(password, encoded.salt);
      const privateKey = await crypto.subtle.unwrapKey(
        "pkcs8",
        hexToBuf(encoded.passwordProtectedPrivateKey),
        derviedKey,
        {
          name: "AES-GCM",
          iv: hexToBuf(encoded.iv),
        },
        { name: "Ed25519" },
        true,
        ["sign"],
      );

      return new BlahKeyPair(publicIdentity, privateKey);
    } else {
      const privateKey = await crypto.subtle.importKey(
        "jwk",
        encoded.privateKey,
        { name: "Ed25519" },
        true,
        ["sign"],
      );

      return new BlahKeyPair(publicIdentity, privateKey);
    }
  }

  async encode(password?: string): Promise<EncodedBlahKeyPair> {
    if (!this.privateKey.extractable) {
      throw new Error("Private key is not extractable.");
    }

    if (password) {
      const saltBuf = new Uint8Array(16);
      crypto.getRandomValues(saltBuf);
      const salt = bufToHex(saltBuf);

      const ivBuf = new Uint8Array(12);
      crypto.getRandomValues(ivBuf);
      const iv = bufToHex(ivBuf);

      const derviedKey = await pbkdf2Key(password, saltBuf);
      const wrappedPrivateKey = await crypto.subtle.wrapKey(
        "pkcs8",
        this.privateKey,
        derviedKey,
        {
          name: "AES-GCM",
          iv: ivBuf,
        },
      );

      return {
        v: "0",
        id: this.publicKey.id,
        passwordProtectedPrivateKey: bufToHex(wrappedPrivateKey),
        iv,
        salt,
      };
    } else {
      return {
        v: "0",
        id: this.publicKey.id,
        privateKey: await crypto.subtle.exportKey("jwk", this.privateKey),
      };
    }
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
      act_key: this.id,
    };

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
