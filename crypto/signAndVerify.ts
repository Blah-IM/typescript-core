import canonicalize from "./canonicalize.ts";
import type { BlahKeyPair } from "./keypair.ts";
import type { BlahPublicKey } from "./publicKey.ts";
import type { BlahPayloadSignee, BlahSignedPayload } from "./signedPayload.ts";
import { bufToHex, hexToBuf } from "./utils.ts";

/**
 * Options for signing or verifying a payload.
 */
export interface SignOrVerifyOptions {
  /**
   * The identity key ID to include in the signed payload, or in case of verification,
   * the expected identity key ID.
   *
   * If not provided during signing, the key ID of the key pair will be used.
   *
   * If not provided during verification, the identity key ID in the payload must be the same as
   * the act key ID.
   */
  identityKeyId?: string;
  /**
   * The proof-of-work difficulty for signing or verifying the payload.
   *
   * If not provided, no proof-of-work or verification of it will be performed.
   *
   * If provided during signing, proof-of-work will be performed to meet the specified difficulty.
   *
   * If provided during verification, the payload will be verified to see if the proof-of-work
   * difficulty is met. If not, the verification will fail.
   */
  powDifficulty?: number;
}

/**
 * Options for signing a payload with a date.
 *
 * This is a superset of the options for signing or verifying a payload.
 *
 * @see {@link SignOrVerifyOptions}
 */
export interface SignOptions extends SignOrVerifyOptions {
  /**
   * The date to use for signing the payload.
   *
   * When is signing a payload, this date is used to set the timestamp. If not provided,
   * the current date and time will be used.
   */
  date?: Date;
}

async function verifyPoWIsMet(signeeBytes: Uint8Array, difficulty: number) {
  const zeroBytes = difficulty >> 3;
  const nonzeroByteMax = 1 << (8 - (difficulty & 7));

  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", signeeBytes));
  let passed = h[zeroBytes] < nonzeroByteMax;
  for (let j = 0; j < zeroBytes; j++) passed &&= h[j] === 0;

  return passed;
}

/**
 * Sign a payload with the given key pair as act key.
 *
 * @param keyPair The key pair to sign the payload with.
 * @param payload The payload to sign.
 * @param options Options for signing.
 * @returns The signed payload.
 */
export async function signPayload<P>(
  keyPair: BlahKeyPair,
  payload: P,
  options: SignOptions = {},
): Promise<BlahSignedPayload<P>> {
  const { date = new Date(), identityKeyId, powDifficulty } = options;

  const nonceBuf = new Uint32Array(1);
  crypto.getRandomValues(nonceBuf);

  const timestamp = Math.floor(date.getTime() / 1000);

  const signee: BlahPayloadSignee<P> = {
    nonce: nonceBuf[0],
    payload,
    timestamp,
    id_key: identityKeyId ?? keyPair.id,
    act_key: keyPair.id,
  };

  const textEncoder = new TextEncoder();
  let signeeBytes = textEncoder.encode(canonicalize(signee));

  if (powDifficulty && powDifficulty !== 0) {
    while (!await verifyPoWIsMet(signeeBytes, powDifficulty)) {
      signee.nonce = (signee.nonce + 1) & 0x7FFFFFFF;
      signeeBytes = textEncoder.encode(canonicalize(signee));
    }
  }

  const rawSig = await crypto.subtle.sign(
    "Ed25519",
    keyPair.privateKey,
    signeeBytes,
  );
  return {
    sig: bufToHex(rawSig),
    signee,
  };
}

/**
 * Verify a signed payload with the given public key.
 *
 * @param publicKey The public key to verify the payload with.
 * @param signedPayload The signed payload to verify.
 * @param options Options for verification.
 * @returns The payload if the signature is valid.
 * @throws If the signature is invalid or the payload is not signed by the expected key.
 */
export async function verifyPayload<P>(
  publicKey: BlahPublicKey,
  signedPayload: BlahSignedPayload<P>,
  options: SignOrVerifyOptions = {},
): Promise<P> {
  const { identityKeyId, powDifficulty } = options;

  const { sig, signee } = signedPayload;

  if (identityKeyId) {
    if (identityKeyId !== signee.id_key) {
      throw new Error(
        `Payload is not signed by the expected identity key. Expected ${identityKeyId}, but was ${signee.id_key}.`,
      );
    }
  } else {
    if (signee.id_key !== signee.act_key) {
      throw new Error(
        `Payload's identity key (${signee.id_key}) is not the same as the act key (${signee.act_key}).`,
      );
    }
  }

  const signingKey = signee.act_key;
  if (signingKey !== publicKey.id) {
    throw new Error(
      `Payload is not signed by this public key. Was signed by ${signingKey}.`,
    );
  }

  const signeeBytes = new TextEncoder().encode(canonicalize(signee));

  if (
    powDifficulty && powDifficulty !== 0 &&
    !await verifyPoWIsMet(signeeBytes, powDifficulty)
  ) {
    throw new Error(
      `Payload's proof-of-work does not meet the required difficulty of ${powDifficulty}.`,
    );
  }

  const result = await crypto.subtle.verify(
    "Ed25519",
    publicKey.publicKey,
    hexToBuf(sig),
    signeeBytes,
  );
  if (!result) {
    throw new Error("Invalid signature");
  }
  return signee.payload;
}
