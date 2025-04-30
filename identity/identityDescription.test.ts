import {
  type BlahIdentityDescription,
  blahIdentityDescriptionSchema,
  getIdentityDescriptionFileURL,
  identityDescriptionFilePath,
} from "./identityDescription.ts";
import { assertTypeMatchesZodSchema } from "../test/utils.ts";
import { expect } from "@std/expect";

Deno.test("type BlahIdentityDescription is accurate", () => {
  assertTypeMatchesZodSchema<BlahIdentityDescription>(
    blahIdentityDescriptionSchema,
  );
});

Deno.test("getIdentityDescriptionFileURL", () => {
  expect(getIdentityDescriptionFileURL("https://lao.sb")).toBe(
    "https://lao.sb" + identityDescriptionFilePath,
  );

  expect(getIdentityDescriptionFileURL("https://test.lao.sb")).toBe(
    "https://test.lao.sb" + identityDescriptionFilePath,
  );

  expect(() => getIdentityDescriptionFileURL("https://trailing-slash.lao.sb/"))
    .toThrow();
});
