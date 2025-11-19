import { Schema, model, type InferSchemaType } from "mongoose";

const PhoneSchema = new Schema({
  countryCode: { type: String, required: true },
  number: { type: String, required: true },
});

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    dob: { type: Date, required: false },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: null,
    },
    phone: { type: PhoneSchema, required: false },
    groups: [{ type: Schema.Types.ObjectId, ref: "Group" }],
    // INVITATION SYSTEM: Track pending invitations for this user
    pendingInvitations: [
      { type: Schema.Types.ObjectId, ref: "GroupInvitation" },
    ],
  },
  { timestamps: true }
);

//UserSchema.index({ email: 1 });

export type UserDoc = InferSchemaType<typeof UserSchema>;
export default model<UserDoc>("User", UserSchema);
