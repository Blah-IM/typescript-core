import {
  type BlahProfile,
  blahProfileSchema,
  validateIDURLFormat,
} from "./profile.ts";
import { assertTypeMatchesZodSchema } from "../test/utils.ts";
import { expect } from "@std/expect";

Deno.test("type BlahProfile is accurate", () => {
  assertTypeMatchesZodSchema<BlahProfile>(blahProfileSchema);
});

Deno.test("ID URL format - valid", () => {
  expect(validateIDURLFormat("https://lao.sb")).toBe(true);
  expect(validateIDURLFormat("https://test.lao.sb")).toBe(true);
  expect(validateIDURLFormat("https://🧧.lao.sb")).toBe(true);
});

Deno.test("ID URL format - invalid", () => {
  // Must be valid URL
  expect(validateIDURLFormat("lao.sb")).toBe(false);
  // No trailing slash
  expect(validateIDURLFormat("https://lao.sb/")).toBe(false);
  // No search params
  expect(validateIDURLFormat("https://lao.sb?query=1")).toBe(false);
  // No fragment
  expect(validateIDURLFormat("https://lao.sb#fragment")).toBe(false);
  // No path
  expect(validateIDURLFormat("https://lao.sb/path")).toBe(false);
  // No username
  expect(validateIDURLFormat("https://user@lao.sb")).toBe(false);
  // No password
  expect(validateIDURLFormat("https://user:123@lao.sb")).toBe(false);
  // No non-HTTPS protocol
  expect(validateIDURLFormat("http://lao.sb")).toBe(false);
});
