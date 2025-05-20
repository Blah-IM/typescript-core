import { expect, test } from "vitest";

import { BlahKeyPair } from "./mod.ts";

let keypair: BlahKeyPair;

test("generate keypair", async () => {
  keypair = await BlahKeyPair.generate();
});

test("encode & decode keypair", async () => {
  const encoded = await keypair.encode();
  const decoded = await BlahKeyPair.fromEncoded(encoded);

  expect(decoded.id).toBe(keypair.id);
});

test("encode & decode keypair w/ password", async () => {
  const password = "password";
  const encoded = await keypair.encode(password);
  const decoded = await BlahKeyPair.fromEncoded(encoded, password);

  expect(decoded.id).toBe(keypair.id);
});
