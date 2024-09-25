import z from "zod";

export const blahActKeyRecordSchema = z.object({
  typ: z.literal("user_act_key"),
  act_key: z.string(),
  expire_time: z.number().int(),
  comment: z.string(),
});

export type BlahActKeyRecord = {
  typ: "user_act_key";
  act_key: string;
  expire_time: number;
  comment: string;
};
