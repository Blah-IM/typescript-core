import { expect } from "@std/expect";
import { BlahKeyPair, type BlahSignedPayload } from "../crypto/mod.ts";
import { BlahIdentity } from "./identity.ts";
import type { BlahIdentityDescription, BlahProfile } from "./mod.ts";

let idKeyPair: BlahKeyPair;
let actKeyPair: BlahKeyPair;
const profile: BlahProfile = {
  typ: "profile",
  name: "Shibo Lyu",
  preferred_chat_server_urls: [],
  id_urls: ["https://localhost"],
};

let identity: BlahIdentity;
let identityDesc: BlahIdentityDescription;
let identityFromFile: BlahIdentity;

Deno.test("create identity", async () => {
  idKeyPair = await BlahKeyPair.generate();
  actKeyPair = await BlahKeyPair.generate();
  identity = await BlahIdentity.create(idKeyPair, actKeyPair, profile);
});

Deno.test("generate identity description", () => {
  identityDesc = identity.generateIdentityDescription();
});

Deno.test("created identity act key signed correctly", async () => {
  const record = await identity.idPublicKey.verifyPayload(
    identityDesc.act_keys[0],
  );
  expect(record.typ).toBe("user_act_key");
  expect(record.expire_time).toBeGreaterThan(Date.now() / 1000);
  expect(record.comment).toBe("");
  expect(record.act_key).toBe(actKeyPair.id);
});

Deno.test("created identity profile signed correctly", async () => {
  const record = await actKeyPair.publicKey.verifyPayload(
    identityDesc.profile,
  );
  expect(record.typ).toBe("profile");
  expect(record.name).toBe("Shibo Lyu");
  expect(record.preferred_chat_server_urls).toEqual([]);
  expect(record.id_urls).toEqual(["https://localhost"]);
});

Deno.test("parse identity description", async () => {
  identityFromFile = await BlahIdentity.fromIdentityDescription(identityDesc);
  expect(identityFromFile.idPublicKey.id).toBe(idKeyPair.id);
  expect(identityFromFile.actKeys[0].publicKey.id).toBe(actKeyPair.id);
  expect(identityFromFile.profileSigValid).toBe(true);
});

Deno.test("identity description profile sigs are properly verfied", async () => {
  const identityDescWithProfileInvalidProfileSig: BlahIdentityDescription = {
    ...identityDesc,
    profile: { ...identityDesc.profile, sig: "_ obviously not a valid sig _" },
  };
  const identityWithProfileInvalidProfileSig = await BlahIdentity
    .fromIdentityDescription(
      identityDescWithProfileInvalidProfileSig,
    );
  expect(identityWithProfileInvalidProfileSig.profileSigValid).toBe(false);
});

Deno.test("identity description profile must be signed with correct id_key", async () => {
  const rawProfile: BlahProfile = identityDesc.profile.signee.payload;
  const profileSignedWithActKeyAsIdKey: BlahSignedPayload<BlahProfile> =
    await actKeyPair.signPayload(rawProfile);
  const identityDescWithWrongIdKey: BlahIdentityDescription = {
    ...identityDesc,
    profile: profileSignedWithActKeyAsIdKey,
  };
  const identityWithWrongIdKey = await BlahIdentity
    .fromIdentityDescription(identityDescWithWrongIdKey);
  expect(identityWithWrongIdKey.profileSigValid).toBe(false);
});

Deno.test("identity description act key sigs are properly verfied", async () => {
  const identityDescWithActKeyInvalidActKeySig: BlahIdentityDescription = {
    ...identityDesc,
    act_keys: [
      {
        ...identityDesc.act_keys[0],
        sig: "_ obviously not a valid sig _",
      },
    ],
  };
  const identityWithActKeyInvalidActKeySig = await BlahIdentity
    .fromIdentityDescription(
      identityDescWithActKeyInvalidActKeySig,
    );
  expect(identityWithActKeyInvalidActKeySig.actKeys[0].isSigValid).toBe(false);
});

Deno.test("add a second act key", async () => {
  const actKeyPair2 = await BlahKeyPair.generate();
  await identity.addActKey(actKeyPair2, { comment: "test" });
  identityDesc = identity.generateIdentityDescription();

  const record = await identity.idPublicKey.verifyPayload(
    identityDesc.act_keys[1],
  );

  expect(record.typ).toBe("user_act_key");
  expect(record.expire_time).toBeGreaterThan(Date.now() / 1000);
  expect(record.comment).toBe("test");
  expect(record.act_key).toBe(actKeyPair2.id);
});

Deno.test("update first act key", async () => {
  await identity.updateActKey(actKeyPair.id, { comment: "test2" });
  identityDesc = identity.generateIdentityDescription();

  const record = await identity.idPublicKey.verifyPayload(
    identityDesc.act_keys[0],
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
  identityDesc = identity.generateIdentityDescription();

  expect(identityDesc.profile.signee.payload).toEqual(newProfile);
});

Deno.test("throw when try writing to identity without id key pair", () => {
  expect(identityFromFile.updateActKey(actKeyPair.id, { comment: "test2" }))
    .rejects.toMatch(/key pair/i);
});
