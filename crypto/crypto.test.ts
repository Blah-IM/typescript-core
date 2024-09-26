import { expect } from "@std/expect";
import { BlahKeyPair } from "./mod.ts";

let keypair: BlahKeyPair;

Deno.test("generate keypair", async () => {
  keypair = await BlahKeyPair.generate();
});

Deno.test("encode & decode keypair", async () => {
  const encoded = await keypair.encode();
  const decoded = await BlahKeyPair.fromEncoded(encoded);

  expect(decoded.id).toBe(keypair.id);
});

Deno.test("sign & verify payload", async () => {
  const payload = { foo: "bar", baz: 123 };
  const signedPayload = await keypair.signPayload(payload);
  const verifiedPayload = await keypair.publicKey.verifyPayload(
    signedPayload,
  );

  expect(verifiedPayload).toEqual(payload);
});

Deno.test("sign & verify payload with wrong keypair", async () => {
  const keypair2 = await BlahKeyPair.generate();
  const payload = { foo: "bar", baz: 123 };
  const signedPayload = await keypair.signPayload(payload);
  expect(keypair2.publicKey.verifyPayload(signedPayload))
    .rejects.toMatch(/sign/);
});

Deno.test("sign & verify payload with wrong key order but should still work", async () => {
  const payload = { foo: "bar", baz: 123 };
  const signedPayload = await keypair.signPayload(payload);
  const signedPayload2 = {
    sig: signedPayload.sig,
    signee: {
      payload: { baz: 123, foo: "bar" },
      act_key: signedPayload.signee.act_key,
      id_key: signedPayload.signee.id_key,
      nonce: signedPayload.signee.nonce,
      timestamp: signedPayload.signee.timestamp,
    },
  };
  const verifiedPayload = await keypair.publicKey.verifyPayload(
    signedPayload2,
  );
  expect(verifiedPayload).toEqual(payload);
});
