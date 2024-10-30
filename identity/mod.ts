import type z from "zod";

export * from "./identity.ts";

import {
  type BlahProfile,
  blahProfileSchema as internalBlahProfileSchema,
} from "./profile.ts";
const blahProfileSchema: z.ZodType<BlahProfile> = internalBlahProfileSchema;
export { type BlahProfile, blahProfileSchema };

import {
  type BlahIdentityDescription,
  blahIdentityDescriptionSchema as internalBlahIdentityDescriptionSchema,
} from "./identityDescription.ts";
const blahIdentityDescriptionSchema: z.ZodType<BlahIdentityDescription> =
  internalBlahIdentityDescriptionSchema;
export { type BlahIdentityDescription, blahIdentityDescriptionSchema };

import {
  type BlahActKeyRecord,
  blahActKeyRecordSchema as internalBlahActKeyRecordSchema,
} from "./actKey.ts";
const blahActKeyRecordSchema: z.ZodType<BlahActKeyRecord> =
  internalBlahActKeyRecordSchema;
export { type BlahActKeyRecord, blahActKeyRecordSchema };
