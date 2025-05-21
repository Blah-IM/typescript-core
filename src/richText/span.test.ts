import { expectTypeOf, test } from "vitest";

import { type BlahRichTextSpan, blahRichTextSpanSchema } from "./span.ts";
import { z } from "zod/v4";

test("BlahRichTextSpan typed correctly", () => {
  expectTypeOf<BlahRichTextSpan>().toEqualTypeOf<
    z.input<typeof blahRichTextSpanSchema>
  >();
});
