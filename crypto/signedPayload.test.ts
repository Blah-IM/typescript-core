import z from "zod";
import type { BlahSignedPayload } from "./mod.ts";
import {
  type BlahPayloadSignee,
  blahPayloadSigneeSchemaOf,
  blahSignedPayloadSchemaOf,
} from "./signedPayload.ts";
import { assertTypeMatchesZodSchema } from "../test/utils.ts";

const testPayloadSchema = z.object({
  foo: z.string(),
});
type TestPayload = z.infer<typeof testPayloadSchema>;

Deno.test("type BlahPayloadSignee is accurate", () => {
  assertTypeMatchesZodSchema<BlahPayloadSignee<TestPayload>>(
    blahPayloadSigneeSchemaOf(testPayloadSchema),
  );
});

Deno.test("type BlahSignedPayload is accurate", () => {
  assertTypeMatchesZodSchema<BlahSignedPayload<TestPayload>>(
    blahSignedPayloadSchemaOf(testPayloadSchema),
  );
});
