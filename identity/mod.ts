import type z from "zod";

export * from "./identity.ts";

import {
  type BlahProfile,
  blahProfileSchema as internalBlahProfileSchema,
} from "./profile.ts";
const blahProfileSchema: z.ZodType<BlahProfile> = internalBlahProfileSchema;
export { type BlahProfile, blahProfileSchema };

import {
  type BlahIdentityFile,
  blahIdentityFileSchema as internalBlahIdentityFileSchema,
} from "./identityFile.ts";
const blahIdentityFileSchema: z.ZodType<BlahIdentityFile> =
  internalBlahIdentityFileSchema;
export { type BlahIdentityFile, blahIdentityFileSchema };

import {
  type BlahActKeyRecord,
  blahActKeyRecordSchema as internalBlahActKeyRecordSchema,
} from "./actKey.ts";
const blahActKeyRecordSchema: z.ZodType<BlahActKeyRecord> =
  internalBlahActKeyRecordSchema;
export { type BlahActKeyRecord, blahActKeyRecordSchema };
