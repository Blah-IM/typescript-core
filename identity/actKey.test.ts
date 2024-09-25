import { type BlahActKeyRecord, blahActKeyRecordSchema } from "./actKey.ts";
import { assertTypeMatchesZodSchema } from "../test/utils.ts";

Deno.test("type BlahActKeyRecord is accurate", () => {
  assertTypeMatchesZodSchema<BlahActKeyRecord>(blahActKeyRecordSchema);
});
