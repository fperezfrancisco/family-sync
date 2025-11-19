import { Schema, model, type InferSchemaType, Model, Document } from "mongoose";
import crypto from "crypto";

const GroupInvitationSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    inviterUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inviteeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    inviteeUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Set when user with this email exists
    },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString("hex"),
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired", "cancelled"],
      default: "pending",
    },
    message: {
      type: String,
      required: false,
      maxlength: 500,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
    acceptedAt: {
      type: Date,
      required: false,
    },
    respondedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
GroupInvitationSchema.index({ inviteeEmail: 1, status: 1 });
GroupInvitationSchema.index({ groupId: 1, status: 1 });
GroupInvitationSchema.index({ token: 1 });
GroupInvitationSchema.index({ expiresAt: 1 });
GroupInvitationSchema.index({ inviterUserId: 1 });
GroupInvitationSchema.index({ inviteeUserId: 1 });

// Compound index for efficient queries
GroupInvitationSchema.index({ groupId: 1, inviteeEmail: 1, status: 1 });

// Pre-save middleware to set inviteeUserId if user exists
GroupInvitationSchema.pre("save", async function (next) {
  if (this.isNew && !this.inviteeUserId) {
    try {
      const User = model("User");
      const existingUser = await User.findOne({
        email: this.inviteeEmail,
      }).select("_id");
      if (existingUser) {
        this.inviteeUserId = existingUser._id;
      }
    } catch (error) {
      console.log("Error setting inviteeUserId:", error);
    }
  }
  next();
});

// Define interface for instance methods
interface GroupInvitationMethods {
  isExpired(): boolean;
  canRespond(): boolean;
}

// Define interface for static methods that extends Mongoose Model
interface GroupInvitationStatics extends Model<GroupInvitationDoc> {
  findPendingForUser(email: string): Promise<any[]>;
  cleanupExpired(): Promise<any>;
}

// Type for document with methods
type GroupInvitationDoc = InferSchemaType<typeof GroupInvitationSchema> &
  Document &
  GroupInvitationMethods;

// Instance method to check if invitation is expired
GroupInvitationSchema.methods.isExpired = function () {
  return this.expiresAt < new Date() || this.status === "expired";
};

// Instance method to check if invitation can be responded to
GroupInvitationSchema.methods.canRespond = function () {
  return this.status === "pending" && !this.isExpired();
};

// Static method to find user's pending invitations
GroupInvitationSchema.statics.findPendingForUser = function (email: string) {
  return this.find({
    inviteeEmail: email,
    status: "pending",
    expiresAt: { $gt: new Date() },
  })
    .populate("groupId", "name description type")
    .populate("inviterUserId", "name email");
};

// Static method to cleanup expired invitations
GroupInvitationSchema.statics.cleanupExpired = function () {
  return this.updateMany(
    {
      expiresAt: { $lt: new Date() },
      status: "pending",
    },
    {
      $set: { status: "expired" },
    }
  );
};

export type { GroupInvitationDoc };
export default model<GroupInvitationDoc, GroupInvitationStatics>(
  "GroupInvitation",
  GroupInvitationSchema
);
