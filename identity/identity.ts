import type { BlahSignedPayload } from "../crypto/mod.ts";
import type { BlahActKeyRecord } from "./actKey.ts";
import type { BlahProfile } from "./profile.ts";

export class BlahIdentity {
  idKeyId: string;
  actKeys: BlahSignedPayload<BlahActKeyRecord>[];
  profile: BlahSignedPayload<BlahProfile>;
}
