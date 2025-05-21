import { expect, test, expectTypeOf } from "vitest";

import {
  type BlahIdentityDescription,
  blahIdentityDescriptionSchema,
  getIdentityDescriptionFileURL,
  identityDescriptionFilePath,
} from "./identityDescription.ts";
import { z } from "zod/v4";

test("BlahIdentityDescription typed correctly", () => {
  expectTypeOf<
    z.infer<typeof blahIdentityDescriptionSchema>
  >().toEqualTypeOf<BlahIdentityDescription>();
});

test("getIdentityDescriptionFileURL", () => {
  expect(getIdentityDescriptionFileURL("https://lao.sb")).toBe(
    "https://lao.sb" + identityDescriptionFilePath,
  );

  expect(getIdentityDescriptionFileURL("https://test.lao.sb")).toBe(
    "https://test.lao.sb" + identityDescriptionFilePath,
  );

  expect(() =>
    getIdentityDescriptionFileURL("https://trailing-slash.lao.sb/"),
  ).toThrow();
});
