import { z } from "zod";
import { type BlahRichTextSpan, blahRichTextSpanSchema } from "./span.ts";

export const blahRichTextSchema = z.array(blahRichTextSpanSchema);
export type BlahRichText = Array<BlahRichTextSpan>;
