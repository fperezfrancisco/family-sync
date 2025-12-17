import { Schema, model, type InferSchemaType } from "mongoose";

const GroupMemberSchema = new Schema({
  id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: {
    type: String,
    enum: ["owner", "admin", "member", "guest"],
    default: "member",
  },
  // Store member's avatar for group display (auto-updated when user updates their avatar)
  avatar: {
    fullSize: { type: String, required: false },
    small: { type: String, required: false },
  },
});

const GroupSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  type: {
    type: String,
    enum: ["family", "friends", "work", "other"],
    default: "other",
  },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: GroupMemberSchema, required: true }],
  // INVITATION SYSTEM: Track pending member invitations
  pendingInvitations: [{ type: Schema.Types.ObjectId, ref: "GroupInvitation" }],
  // INVITATION SYSTEM: Settings for invitation management
  inviteSettings: {
    allowMemberInvites: { type: Boolean, default: false }, // Can members invite others
    requireApproval: { type: Boolean, default: false }, // Owner must approve invites
    maxMembers: { type: Number, default: null }, // Null = no limit
  },
  // CUSTOMIZATION: Header image and accent color for group branding
  customization: {
    headerImage: {
      source: {
        type: String,
        enum: ["preset", "custom"],
        default: "preset",
      },
      value: {
        type: String,
        default: "mountain-sunrise", // preset name or URL for custom
      },
      uploadedAt: { type: Date, required: false },
      uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    },
    accentColor: {
      preset: {
        type: String,
        default: "blue",
      },
      hex: {
        type: String,
        default: "#3b82f6", // Tailwind blue-500
      },
    },
  },
  createdAt: { type: Date, default: Date.now },
});

GroupSchema.index({ owner: 1 });

export type GroupDoc = InferSchemaType<typeof GroupSchema>;
export default model<GroupDoc>("Group", GroupSchema);
