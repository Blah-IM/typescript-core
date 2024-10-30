import {
  type BlahIdentityDescription,
  blahIdentityDescriptionSchema,
} from "./identityDescription.ts";
import { assertTypeMatchesZodSchema } from "../test/utils.ts";

Deno.test("type BlahidentityDescription is accurate", () => {
  assertTypeMatchesZodSchema<BlahIdentityDescription>(
    blahIdentityDescriptionSchema,
  );
});
