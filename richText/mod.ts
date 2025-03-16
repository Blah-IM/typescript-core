/**
 * `richText` defines the structure of rich text used through out Blah.
 *
 * Note that this module only defines a single block of rich text. That is, we only deal with "inline" elements.
 *
 * @module
 */

import type z from "zod";

import {
  type BlahRichTextSpan,
  type BlahRichTextSpanAttributes,
  blahRichTextSpanAttributesSchema as internalBlahRichTextSpanAttributesSchema,
  blahRichTextSpanSchema as internalBlahRichTextSpanSchema,
} from "./span.ts";
const blahRichTextSpanAttributesSchema: z.ZodType<BlahRichTextSpanAttributes> =
  internalBlahRichTextSpanAttributesSchema;
const blahRichTextSpanSchema: z.ZodType<BlahRichTextSpan> =
  internalBlahRichTextSpanSchema;
export {
  type BlahRichTextSpan,
  type BlahRichTextSpanAttributes,
  blahRichTextSpanAttributesSchema,
  blahRichTextSpanSchema,
};

import {
  type BlahRichText,
  blahRichTextSchema as internalBlahRichTextSchema,
} from "./richText.ts";
const blahRichTextSchema: z.ZodType<BlahRichText> = internalBlahRichTextSchema;
export { type BlahRichText, blahRichTextSchema };

export * from "./toPlainText.ts";
