import z from "zod";

export const blahActKeyRecordSchema = z.object({
  typ: z.literal("use_act_key"),
  act_key: z.string(),
  expire_time: z.number().int(),
  comment: z.string(),
});

export type BlahActKeyRecord = z.input<typeof blahActKeyRecordSchema>;
export type BlahParsedActKeyRecord = z.infer<typeof blahActKeyRecordSchema>;
