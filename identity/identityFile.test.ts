import {
  type BlahIdentityFile,
  blahIdentityFileSchema,
} from "./identityFile.ts";
import { assertTypeMatchesZodSchema } from "../test/utils.ts";

Deno.test("type BlahIdentityFile is accurate", () => {
  assertTypeMatchesZodSchema<BlahIdentityFile>(blahIdentityFileSchema);
});
