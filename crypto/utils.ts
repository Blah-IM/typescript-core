export function bufToHex(buf: ArrayBufferLike | Uint8Array): string {
  const u8Array = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return [...u8Array].map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBuf(hex: string): Uint8Array {
  return new Uint8Array(
    (hex.match(/[\da-f]{2}/gi) ?? []).map((m) => parseInt(m, 16)),
  );
}

// https://stackoverflow.com/a/79145876
const ed25519PKCS8Prefix = hexToBuf("302e020100300506032b657004220420");
export function ed25519RawPrivateKeyToPKCS8(
  buf: ArrayBufferLike | Uint8Array,
): Uint8Array {
  const u8Array = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const pkcs8 = new Uint8Array(ed25519PKCS8Prefix.length + u8Array.length);
  pkcs8.set(ed25519PKCS8Prefix, 0);
  pkcs8.set(u8Array, ed25519PKCS8Prefix.length);
  return pkcs8;
}
export function ed25519PKCS8ToRawPrivateKey(
  buf: ArrayBufferLike | Uint8Array,
): Uint8Array {
  const u8Array = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return u8Array.slice(ed25519PKCS8Prefix.length);
}
