import { z } from "zod/v4";

/** Schema for Blah user profile. */
export const blahProfileSchema = z.object({
  typ: z.literal("profile"),
  preferred_chat_server_urls: z.array(z.url()),
  id_urls: z.array(z.string().refine(validateIDURLFormat)).min(1),
  name: z.string(),
  bio: z.string().optional(),
});

/** Type for Blah user profile. */
export type BlahProfile = {
  typ: "profile";
  preferred_chat_server_urls: string[];
  id_urls: string[];
  name: string;
  bio?: string;
};

/** Validate the format of an ID URL. */
export function validateIDURLFormat(url: string): boolean {
  try {
    const idURL = new URL(url);
    return (
      !!idURL &&
      idURL.protocol === "https:" &&
      idURL.pathname === "/" &&
      !url.endsWith("/") &&
      !idURL.search &&
      !idURL.hash &&
      !idURL.username &&
      !idURL.password
    );
  } catch {
    return false;
  }
}
