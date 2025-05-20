import { expectTypeOf, test } from "vitest";

import { type BlahActKeyRecord, blahActKeyRecordSchema } from "./actKey.ts";
import z from "zod";

test("BlahActKeyRecord typed correctly", () => {
  expectTypeOf<
    z.infer<typeof blahActKeyRecordSchema>
  >().toEqualTypeOf<BlahActKeyRecord>();
});
