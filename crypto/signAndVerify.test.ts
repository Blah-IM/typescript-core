import { expect } from "@std/expect";
import { BlahKeyPair } from "./keypair.ts";
import { z } from "zod";
import { BlahPublicKey } from "./publicKey.ts";
import type { SignOrVerifyOptions } from "./signAndVerify.ts";

const keypair = await BlahKeyPair.generate();

Deno.test("sign & verify payload", async () => {
  const payload = { foo: "bar", baz: 123 };
  const signedPayload = await keypair.signPayload(payload);
  const verifiedPayload = await keypair.publicKey.verifyPayload(
    signedPayload,
  );

  expect(verifiedPayload).toEqual(payload);
});

Deno.test("sign and verify with POW", async () => {
  const payload = { foo: "bar-pow", baz: 123 };
  const options: SignOrVerifyOptions = { powDifficulty: 1 };
  const signedPayload = await keypair.signPayload(payload, options);
  const verifiedPayload = await keypair.publicKey.verifyPayload(
    signedPayload,
    options,
  );

  expect(verifiedPayload).toEqual(payload);
});

Deno.test("sign and verify with unmet POW", async () => {
  const payload = { foo: "bar", baz: 123 };
  const signedPayload = await keypair.signPayload(payload, {
    powDifficulty: 1,
  });

  await expect(keypair.publicKey.verifyPayload(
    signedPayload,
    { powDifficulty: 6 },
  )).rejects.toMatch(/proof-of-work/);
});

Deno.test("parse and verify payload", async () => {
  const payloadSchema = z.object({
    foo: z.string(),
    baz: z.number(),
  }).strict();
  const payload = { foo: "bar", baz: 123 };
  const signedPayload = await keypair.signPayload(payload);
  const { payload: verifiedPayload, key } = await BlahPublicKey
    .parseAndVerifyPayload(
      payloadSchema,
      signedPayload,
    );

  expect(verifiedPayload).toEqual(payload);
  expect(key.id).toBe(keypair.id);
});

Deno.test("parse and verify corrupted payload", async () => {
  const payloadSchema = z.object({
    foo: z.string(),
    baz: z.number(),
  }).strict();
  const payload = { foo: "bar", baz: 123, qux: "quux" };
  const signedPayload = await keypair.signPayload(payload);

  await expect(BlahPublicKey
    .parseAndVerifyPayload(
      payloadSchema,
      signedPayload,
    )).rejects.toMatch(/unrecognized/);
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
