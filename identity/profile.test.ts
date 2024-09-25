import { type BlahProfile, blahProfileSchema } from "./profile.ts";
import { assertTypeMatchesZodSchema } from "../test/utils.ts";

Deno.test("type BlahProfile is accurate", () => {
  assertTypeMatchesZodSchema<BlahProfile>(blahProfileSchema);
});
