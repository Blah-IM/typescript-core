import { z } from "zod";
import { blahSignedPayloadSchemaOf } from "../crypto/signedPayload.ts";
import { type BlahActKeyRecord, blahActKeyRecordSchema } from "./actKey.ts";
import { type BlahProfile, blahProfileSchema } from "./profile.ts";
import type { BlahSignedPayload } from "../crypto/mod.ts";

export const blahIdentityFileSchema = z.object({
  id_key: z.string(),
  act_keys: z.array(blahSignedPayloadSchemaOf(blahActKeyRecordSchema)),
  profile: blahSignedPayloadSchemaOf(blahProfileSchema),
});

export type BlahIdentityFile = {
  id_key: string;
  act_keys: Array<BlahSignedPayload<BlahActKeyRecord>>;
  profile: BlahSignedPayload<BlahProfile>;
};
