import z from "zod";

export function blahPayloadSigneeSchemaOf<P extends z.ZodTypeAny>(schema: P) {
  return z.object({
    nonce: z.number().int(),
    payload: schema,
    timestamp: z.number().int(),
    id_key: z.string(),
    act_key: z.string(),
  });
}

export function blahSignedPayloadSchemaOf<P extends z.ZodTypeAny>(schema: P) {
  return z.object({
    sig: z.string(),
    signee: blahPayloadSigneeSchemaOf(schema),
  });
}

export type BlahPayloadSignee<P> = {
  nonce: number;
  payload: P;
  timestamp: number;
  id_key: string;
  act_key: string;
};

export type BlahSignedPayload<P> = {
  sig: string;
  signee: BlahPayloadSignee<P>;
};
