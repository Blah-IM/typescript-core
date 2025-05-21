import type { z } from "zod/v4";

export * from "./identity.ts";

import {
  type BlahProfile,
  blahProfileSchema as internalBlahProfileSchema,
  validateIDURLFormat,
} from "./profile.ts";
const blahProfileSchema: z.ZodType<BlahProfile> = internalBlahProfileSchema;
export { type BlahProfile, blahProfileSchema, validateIDURLFormat };

import {
  type BlahIdentityDescription,
  blahIdentityDescriptionSchema as internalBlahIdentityDescriptionSchema,
  getIdentityDescriptionFileURL,
  identityDescriptionFilePath,
} from "./identityDescription.ts";
const blahIdentityDescriptionSchema: z.ZodType<BlahIdentityDescription> =
  internalBlahIdentityDescriptionSchema;
export {
  type BlahIdentityDescription,
  blahIdentityDescriptionSchema,
  getIdentityDescriptionFileURL,
  identityDescriptionFilePath,
};

import {
  type BlahActKeyRecord,
  blahActKeyRecordSchema as internalBlahActKeyRecordSchema,
} from "./actKey.ts";
const blahActKeyRecordSchema: z.ZodType<BlahActKeyRecord> =
  internalBlahActKeyRecordSchema;
export { type BlahActKeyRecord, blahActKeyRecordSchema };
