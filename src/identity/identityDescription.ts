import { z } from "zod/v4";
import { blahSignedPayloadSchemaOf } from "../crypto/signedPayload.ts";
import { type BlahActKeyRecord, blahActKeyRecordSchema } from "./actKey.ts";
import {
  type BlahProfile,
  blahProfileSchema,
  validateIDURLFormat,
} from "./profile.ts";
import type { BlahSignedPayload } from "../crypto/mod.ts";

/** Schema for Blah identity description. */
export const blahIdentityDescriptionSchema = z.object({
  id_key: z.string(),
  act_keys: z.array(blahSignedPayloadSchemaOf(blahActKeyRecordSchema)).min(1),
  profile: blahSignedPayloadSchemaOf(blahProfileSchema),
});

/** Type for Blah identity description. */
export type BlahIdentityDescription = {
  id_key: string;
  act_keys: Array<BlahSignedPayload<BlahActKeyRecord>>;
  profile: BlahSignedPayload<BlahProfile>;
};

/** Path to the identity description file under a given ID URL. */
export const identityDescriptionFilePath = "/.well-known/blah/identity.json";

/**
 * Get the full URL to the identity description file for a given ID URL.
 *
 * @param idURL - The ID URL to get the identity description file URL for.
 * @returns The full URL to the identity description file.
 * @throws Error if the ID URL format is invalid.
 */
export function getIdentityDescriptionFileURL(idURL: string): string {
  if (!validateIDURLFormat(idURL)) throw new Error("Invalid ID URL format");
  const url = new URL(idURL);
  url.pathname = identityDescriptionFilePath;
  return url.toString();
}
