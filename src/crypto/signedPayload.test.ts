import { expectTypeOf, test } from "vitest";

import { z } from "zod/v4";
import type { BlahSignedPayload } from "./mod.ts";
import {
  type BlahPayloadSignee,
  blahPayloadSigneeSchemaOf,
  blahSignedPayloadSchemaOf,
} from "./signedPayload.ts";

const testPayloadSchema = z.object({
  foo: z.string(),
});
type TestPayload = z.infer<typeof testPayloadSchema>;

test("BlahPayloadSignee typed correctly", () => {
  const signeeSchema = blahPayloadSigneeSchemaOf(testPayloadSchema);
  expectTypeOf<z.infer<typeof signeeSchema>>().toEqualTypeOf<
    BlahPayloadSignee<TestPayload>
  >();
});

test("BlahSignedPayload typed correctly", () => {
  const signedPayloadSchema = blahSignedPayloadSchemaOf(testPayloadSchema);
  expectTypeOf<z.infer<typeof signedPayloadSchema>>().toEqualTypeOf<
    BlahSignedPayload<TestPayload>
  >();
});
