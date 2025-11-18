import { Schema, model } from "mongoose";
const RefreshSessionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    jti: { type: String, required: true, unique: true }, // JWT ID
    isRevoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
});
export default model("RefreshSession", RefreshSessionSchema);
//# sourceMappingURL=Auth.js.map