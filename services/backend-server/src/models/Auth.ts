import { Schema, model, type InferSchemaType } from "mongoose";

const RefreshSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  jti: { type: String, required: true, unique: true }, // JWT ID
  isRevoked: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
});

export type RefreshSessionDoc = InferSchemaType<typeof RefreshSessionSchema>;
export default model<RefreshSessionDoc>("RefreshSession", RefreshSessionSchema);
