import { assertTypeMatchesZodSchema } from "../test/utils.ts";
import { type BlahRichText, blahRichTextSchema } from "./richText.ts";

Deno.test("type BlahRichText is accurate", () => {
  assertTypeMatchesZodSchema<BlahRichText>(
    blahRichTextSchema,
  );
});
