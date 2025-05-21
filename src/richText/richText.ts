import { z } from "zod/v4";
import { type BlahRichTextSpan, blahRichTextSpanSchema } from "./span.ts";

export const blahRichTextSchema = z.array(blahRichTextSpanSchema);
export type BlahRichText = Array<BlahRichTextSpan>;
