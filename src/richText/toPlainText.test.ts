import { expect, test } from "vitest";

import type { BlahRichText } from "./mod.ts";
import { toPlainText } from "./toPlainText.ts";

test("toPlainText", () => {
  const richText: BlahRichText = ["hello ", ["world", { b: true }]];
  expect(toPlainText(richText)).toBe("hello world");
});
