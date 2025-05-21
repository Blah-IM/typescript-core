import { expectTypeOf, test } from "vitest";

import { type BlahRichText, blahRichTextSchema } from "./richText.ts";
import { z } from "zod/v4";

test("BlahRichText typed correctly", () => {
  expectTypeOf<
    z.input<typeof blahRichTextSchema>
  >().toEqualTypeOf<BlahRichText>();
});
