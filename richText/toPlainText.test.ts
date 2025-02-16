import { expect } from "@std/expect";
import type { BlahRichText } from "./mod.ts";
import { toPlainText } from "./toPlainText.ts";

Deno.test("toPlainText", () => {
  const richText: BlahRichText = ["hello ", ["world", { b: true }]];
  expect(toPlainText(richText)).toBe("hello world");
});
