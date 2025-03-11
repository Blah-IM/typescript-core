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
