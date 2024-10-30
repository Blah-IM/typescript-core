import { expect } from "@std/expect";
import { BlahKeyPair } from "../crypto/mod.ts";
import { BlahIdentity } from "./identity.ts";
import type { BlahIdentityFile, BlahProfile } from "./mod.ts";

let idKeyPair: BlahKeyPair;
let actKeyPair: BlahKeyPair;
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
  idKeyPair = await BlahKeyPair.generate();
  actKeyPair = await BlahKeyPair.generate();
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
  expect(record.act_key).toBe(actKeyPair.id);
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

Deno.test("identity file profile sigs are properly verfied", async () => {
  const identityFileWithProfileInvalidProfileSig: BlahIdentityFile = {
    ...identityFile,
    profile: { ...identityFile.profile, sig: "_ obviously not a valid sig _" },
  };
  const identityWithProfileInvalidProfileSig = await BlahIdentity
    .fromIdentityFile(
      identityFileWithProfileInvalidProfileSig,
    );
  expect(identityWithProfileInvalidProfileSig.profileSigValid).toBe(false);
});

Deno.test("identity file act key sigs are properly verfied", async () => {
  const identityFileWithActKeyInvalidActKeySig: BlahIdentityFile = {
    ...identityFile,
    act_keys: [
      {
        ...identityFile.act_keys[0],
        sig: "_ obviously not a valid sig _",
      },
    ],
  };
  const identityWithActKeyInvalidActKeySig = await BlahIdentity
    .fromIdentityFile(
      identityFileWithActKeyInvalidActKeySig,
    );
  expect(identityWithActKeyInvalidActKeySig.actKeys[0].isSigValid).toBe(false);
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
  expect(record.act_key).toBe(actKeyPair2.id);
});

Deno.test("update first act key", async () => {
  await identity.updateActKey(actKeyPair.id, { comment: "test2" });
  identityFile = identity.generateIdentityFile();

  const record = await identity.idPublicKey.verifyPayload(
    identityFile.act_keys[0],
  );

  expect(record.comment).toBe("test2");
});

Deno.test("act key properly expires", async () => {
  expect(identity.actKeys[0].isExpired).toBe(false);
  await identity.updateActKey(actKeyPair.id, { expiresAt: new Date(10000) });
  expect(identity.actKeys[0].isExpired).toBe(true);
});

Deno.test("update profile", async () => {
  const newProfile: BlahProfile = {
    typ: "profile",
    name: "Shibo Lyu",
    preferred_chat_server_urls: ["https://example.com"],
    id_urls: ["https://localhost:8080"],
  };

  await identity.updateProfile(newProfile);
  identityFile = identity.generateIdentityFile();

  expect(identityFile.profile.signee.payload).toEqual(newProfile);
});

Deno.test("throw when try writing to identity without id key pair", () => {
  expect(identityFromFile.updateActKey(actKeyPair.id, { comment: "test2" }))
    .rejects.toMatch(/key pair/i);
});
