import canonicalize from "./canonicalize.ts";
import { hexToBuf } from "./mod.ts";
import { pbkdf2Key } from "./pbkdf2.ts";
import { BlahPublicKey } from "./publicKey.ts";
import type { BlahPayloadSignee, BlahSignedPayload } from "./signedPayload.ts";
import {
  bufToHex,
  ed25519PKCS8ToRawPrivateKey,
  ed25519RawPrivateKeyToPKCS8,
} from "./utils.ts";

export type EncodedBlahKeyPair =
  & {
    v: "0";
    id: string;
  }
  & ({
    private: string;
  } | {
    password_protected_private: string;
    iv: string;
    salt: string;
  });

export class BlahKeyPair {
  private internalPublicKey: BlahPublicKey;
  private internalPrivateKey: CryptoKey;

  get id(): string {
    return this.internalPublicKey.id;
  }
  get name(): string {
    return this.internalPublicKey.name;
  }

  get publicKey(): BlahPublicKey {
    return this.internalPublicKey;
  }

  get privateKey(): CryptoKey {
    return this.internalPrivateKey;
  }

  constructor(publicKey: BlahPublicKey, privateKey: CryptoKey) {
    this.internalPublicKey = publicKey;
    this.internalPrivateKey = privateKey;
  }

  async verifyPayload<P>(signedPayload: BlahSignedPayload<P>): Promise<P> {
    return await this.internalPublicKey.verifyPayload(signedPayload);
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

    if ("password_protected_private" in encoded) {
      if (!password) {
        throw new Error("Private key is password-protected.");
      }

      const derviedKey = await pbkdf2Key(password, encoded.salt);
      const encryptedKeyData = hexToBuf(encoded.password_protected_private);
      const decryptedKeyData = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: hexToBuf(encoded.iv),
        },
        derviedKey,
        encryptedKeyData,
      );
      const pkcs8Bytes = ed25519RawPrivateKeyToPKCS8(decryptedKeyData);

      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        pkcs8Bytes,
        { name: "Ed25519" },
        true,
        ["sign"],
      );

      return new BlahKeyPair(publicIdentity, privateKey);
    } else {
      const pkcs8Bytes = ed25519RawPrivateKeyToPKCS8(hexToBuf(encoded.private));
      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        pkcs8Bytes,
        { name: "Ed25519" },
        true,
        ["sign"],
      );

      return new BlahKeyPair(publicIdentity, privateKey);
    }
  }

  async encode(password?: string): Promise<EncodedBlahKeyPair> {
    if (!this.internalPrivateKey.extractable) {
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

      const pkcs8Bytes = await crypto.subtle.exportKey(
        "pkcs8",
        this.internalPrivateKey,
      );
      const rawPrivateKeyBytes = ed25519PKCS8ToRawPrivateKey(pkcs8Bytes);

      const wrappedPrivateKey = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: ivBuf,
        },
        derviedKey,
        rawPrivateKeyBytes,
      );

      return {
        v: "0",
        id: this.internalPublicKey.id,
        password_protected_private: bufToHex(wrappedPrivateKey),
        iv,
        salt,
      };
    } else {
      const pkcs8Bytes = await crypto.subtle.exportKey(
        "pkcs8",
        this.internalPrivateKey,
      );
      const rawPrivateKeyBytes = ed25519PKCS8ToRawPrivateKey(pkcs8Bytes);
      const rawPrivateKey = bufToHex(rawPrivateKeyBytes);
      return {
        v: "0",
        id: this.internalPublicKey.id,
        private: rawPrivateKey,
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
      this.internalPrivateKey,
      signeeBytes,
    );
    return {
      sig: bufToHex(rawSig),
      signee,
    };
  }
}
