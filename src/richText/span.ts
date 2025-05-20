import { z } from "zod";

export const blahRichTextSpanAttributesSchema = z.object({
  b: z.boolean().default(false),
  i: z.boolean().default(false),
  u: z.boolean().default(false),
  s: z.boolean().default(false),
  m: z.boolean().default(false),
  tag: z.boolean().default(false),
  spoiler: z.boolean().default(false),
  link: z.string().url().optional(),
});

export type BlahRichTextSpanAttributes = {
  b?: boolean;
  i?: boolean;
  u?: boolean;
  s?: boolean;
  m?: boolean;
  tag?: boolean;
  spoiler?: boolean;
  link?: string | undefined;
};

export const blahRichTextSpanSchema = z.union([
  z.string(),
  z.tuple([z.string(), blahRichTextSpanAttributesSchema]),
]);
export type BlahRichTextSpan = string | [string, BlahRichTextSpanAttributes];
