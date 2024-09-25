import { assertType, type IsExact } from "@std/testing/types";
import type { z } from "zod";

export function assertTypeMatchesZodSchema<T>(
  schema: z.ZodTypeAny,
) {
  assertType<IsExact<T, z.infer<typeof schema>>>(
    true as IsExact<T, z.infer<typeof schema>>,
  );
}
