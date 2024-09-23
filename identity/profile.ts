import z from "zod";

export const blahProfileSchema = z.object({
  typ: z.literal("profile"),
  preferred_chat_server_urls: z.array(z.string().url()),
  id_urls: z.array(z.string().url()),
  name: z.string(),
  bio: z.string().optional(),
});

export type BlahProfile = z.input<typeof blahProfileSchema>;
export type BlahParsedProfile = z.infer<typeof blahProfileSchema>;
