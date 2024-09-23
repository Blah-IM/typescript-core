import { z } from "zod";
import { blahSignedPayloadSchemaOf } from "../crypto/mod.ts";
import { blahActKeyRecordSchema } from "./actKey.ts";
import { blahProfileSchema } from "./profile.ts";

export const blahIdentityFileSchema = z.object({
  id_key: z.string(),
  act_keys: z.array(blahSignedPayloadSchemaOf(blahActKeyRecordSchema)),
  profile: blahSignedPayloadSchemaOf(blahProfileSchema),
});

export type BlahIdentityFile = z.input<typeof blahIdentityFileSchema>;
export type BlahParsedIdentityFile = z.infer<typeof blahIdentityFileSchema>;
