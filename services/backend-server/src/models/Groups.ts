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
  createdAt: { type: Date, default: Date.now },
});

GroupSchema.index({ owner: 1 });

export type GroupDoc = InferSchemaType<typeof GroupSchema>;
export default model<GroupDoc>("Group", GroupSchema);
