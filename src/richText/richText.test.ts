import { expectTypeOf, test } from "vitest";

import { type BlahRichText, blahRichTextSchema } from "./richText.ts";
import z from "zod";

test("BlahRichText typed correctly", () => {
  expectTypeOf<
    z.input<typeof blahRichTextSchema>
  >().toEqualTypeOf<BlahRichText>();
});
