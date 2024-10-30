import {
  type BlahIdentityDescription,
  blahIdentityDescriptionSchema,
} from "./identityDescription.ts";
import { assertTypeMatchesZodSchema } from "../test/utils.ts";

Deno.test("type BlahIdentityDescription is accurate", () => {
  assertTypeMatchesZodSchema<BlahIdentityDescription>(
    blahIdentityDescriptionSchema,
  );
});
