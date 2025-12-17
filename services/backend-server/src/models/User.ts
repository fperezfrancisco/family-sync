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
    // PROFILE IMAGES: Store URLs for profile avatar and banner images
    avatar: {
      fullSize: { type: String, required: false },
      small: { type: String, required: false },
      version: { type: Number, default: 1 }, // Toggle between 1 and 2 for cache busting
    },
    banner: {
      fullSize: { type: String, required: false },
      small: { type: String, required: false },
      version: { type: Number, default: 1 }, // Toggle between 1 and 2 for cache busting
    },
    // Legacy fields for backward compatibility
    avatarUrl: { type: String, required: false },
    bannerUrl: { type: String, required: false },
  },
  { timestamps: true }
);

//UserSchema.index({ email: 1 });

export type UserDoc = InferSchemaType<typeof UserSchema>;
export default model<UserDoc>("User", UserSchema);
