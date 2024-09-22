export type BlahPayloadSignee<P> = {
  nonce: number;
  payload: P;
  timestamp: number;
  id_key: string;
  act_key?: string;
};

export type BlahSignedPayload<P> = {
  sig: string;
  signee: BlahPayloadSignee<P>;
};
