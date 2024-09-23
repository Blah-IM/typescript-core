import z from "zod";

export function blahPayloadSigneeSchemaOf<P extends z.ZodTypeAny>(schema: P) {
  return z.object({
    nonce: z.number().int(),
    payload: schema,
    timestamp: z.number().int(),
    id_key: z.string(),
    act_key: z.string().optional(),
  });
}

export function blahSignedPayloadSchemaOf<P extends z.ZodTypeAny>(schema: P) {
  return z.object({
    sig: z.string(),
    signee: blahPayloadSigneeSchemaOf(schema),
  });
}

export type BlahPayloadSignee<P extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof blahPayloadSigneeSchemaOf<P>>
>;

export type BlahSignedPayload<P extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof blahSignedPayloadSchemaOf<P>>
>;
