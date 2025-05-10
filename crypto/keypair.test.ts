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

Deno.test("encode & decode keypair w/ password", async () => {
  const password = "password";
  const encoded = await keypair.encode(password);
  const decoded = await BlahKeyPair.fromEncoded(encoded, password);

  expect(decoded.id).toBe(keypair.id);
});
