import { expect } from "@std/expect";
import { BlahKeyPair } from "../crypto/mod.ts";
import { BlahIdentity } from "./identity.ts";
import type { BlahIdentityFile, BlahProfile } from "./mod.ts";

const idKeyPair = await BlahKeyPair.generate();
const actKeyPair = await BlahKeyPair.generate();
const profile: BlahProfile = {
  typ: "profile",
  name: "Shibo Lyu",
  preferred_chat_server_urls: [],
  id_urls: [],
};

let identity: BlahIdentity;
let identityFile: BlahIdentityFile;
let identityFromFile: BlahIdentity;

Deno.test("create identity", async () => {
  identity = await BlahIdentity.create(idKeyPair, actKeyPair, profile);
});

Deno.test("generate identity file", () => {
  identityFile = identity.generateIdentityFile();
});

Deno.test("created identity act key signed correctly", async () => {
  const record = await identity.idPublicKey.verifyPayload(
    identityFile.act_keys[0],
  );
  expect(record.typ).toBe("user_act_key");
  expect(record.expire_time).toBeGreaterThan(Date.now() / 1000);
  expect(record.comment).toBe("");
  expect(record.act_key).toBe(actKeyPair.publicKey.id);
});

Deno.test("created identity profile signed correctly", async () => {
  const record = await actKeyPair.publicKey.verifyPayload(
    identityFile.profile,
  );
  expect(record.typ).toBe("profile");
  expect(record.name).toBe("Shibo Lyu");
  expect(record.preferred_chat_server_urls).toEqual([]);
  expect(record.id_urls).toEqual([]);
});

Deno.test("parse identity file", async () => {
  identityFromFile = await BlahIdentity.fromIdentityFile(identityFile);
});

Deno.test("add a second act key", async () => {
  const actKeyPair2 = await BlahKeyPair.generate();
  await identity.addActKey(actKeyPair2, { comment: "test" });
  identityFile = identity.generateIdentityFile();

  const record = await identity.idPublicKey.verifyPayload(
    identityFile.act_keys[1],
  );

  expect(record.typ).toBe("user_act_key");
  expect(record.expire_time).toBeGreaterThan(Date.now() / 1000);
  expect(record.comment).toBe("test");
  expect(record.act_key).toBe(actKeyPair2.publicKey.id);
});

Deno.test("update first act key", async () => {
  await identity.updateActKey(actKeyPair.id, { comment: "test2" });
  identityFile = identity.generateIdentityFile();

  const record = await identity.idPublicKey.verifyPayload(
    identityFile.act_keys[0],
  );

  expect(record.comment).toBe("test2");
});

Deno.test("throw when try writing to identity without id key pair", () => {
  expect(identityFromFile.updateActKey(actKeyPair.id, { comment: "test2" }))
    .rejects.toMatch(/key pair/i);
});
