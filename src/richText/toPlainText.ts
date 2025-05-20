import type { BlahRichText } from "./richText.ts";

export function toPlainText(richText: BlahRichText): string {
  return richText.map((span) => (typeof span === "string" ? span : span[0]))
    .join("");
}
