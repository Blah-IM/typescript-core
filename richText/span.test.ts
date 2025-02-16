import { assertTypeMatchesZodSchema } from "../test/utils.ts";
import { type BlahRichTextSpan, blahRichTextSpanSchema } from "./span.ts";

Deno.test("type BlahRichTextSpan is accurate", () => {
  assertTypeMatchesZodSchema<BlahRichTextSpan>(
    blahRichTextSpanSchema,
  );
});
