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
  blahIdentityDescriptionSchema as internalBlahidentityDescriptionSchema,
} from "./identityDescription.ts";
const blahidentityDescriptionSchema: z.ZodType<BlahIdentityDescription> =
  internalBlahidentityDescriptionSchema;
export { type BlahIdentityDescription, blahidentityDescriptionSchema };

import {
  type BlahActKeyRecord,
  blahActKeyRecordSchema as internalBlahActKeyRecordSchema,
} from "./actKey.ts";
const blahActKeyRecordSchema: z.ZodType<BlahActKeyRecord> =
  internalBlahActKeyRecordSchema;
export { type BlahActKeyRecord, blahActKeyRecordSchema };
