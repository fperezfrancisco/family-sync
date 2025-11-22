import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * MESSAGE MODEL
 *
 * Purpose: Store chat messages with persistence for group conversations
 *
 * Features:
 * - Message content and metadata storage
 * - Soft delete capability (for user message deletion)
 * - Message type support (text, image, file)
 * - Optimized queries with indexes
 * - 30-day automatic retention policy
 */

const MessageSchema = new Schema(
  {
    // Message content and basic info
    content: { type: String, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true }, // Denormalized for performance
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },

    // Message metadata
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },

    // Optional: Message status and features (for future enhancements)
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false }, // Soft delete
    deletedAt: { type: Date, default: null },

    // Optional: Reply functionality (for future enhancement)
    replyToMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // File attachment info (for future file upload support)
    attachmentUrl: { type: String, default: null },
    attachmentType: { type: String, default: null },
    attachmentSize: { type: Number, default: null },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    // Optimize document size by excluding version key
    versionKey: false,
  }
);

/**
 * DATABASE INDEXES
 *
 * These indexes optimize common query patterns:
 * 1. Finding messages by group (most common query)
 * 2. Finding recent messages (sorted by timestamp)
 * 3. Cleanup queries for retention policy
 */
MessageSchema.index({ groupId: 1, createdAt: -1 }); // Primary query: get group messages by time
MessageSchema.index({ createdAt: 1 }); // For cleanup/retention queries
MessageSchema.index({ senderId: 1 }); // For user-specific queries

/**
 * STATIC METHODS
 *
 * Convenient methods for common operations
 */
MessageSchema.statics = {
  /**
   * Get recent messages for a group with pagination
   * @param groupId - Group to fetch messages for
   * @param limit - Number of messages to return (default: 50)
   * @param before - Get messages before this date (for pagination)
   */
  async getGroupMessages(groupId: string, limit: number = 50, before?: Date) {
    const query = {
      groupId,
      isDeleted: false, // Only get non-deleted messages
    };

    if (before) {
      // @ts-ignore
      query.createdAt = { $lt: before };
    }

    return this.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .lean(); // Return plain objects for better performance
  },

  /**
   * Clean up old messages based on retention policy
   * @param retentionDays - Number of days to retain messages (default: 30)
   */
  async cleanupOldMessages(retentionDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    console.log(
      `🧹 Cleaned up ${result.deletedCount} old messages older than ${retentionDays} days`
    );
    return result.deletedCount;
  },
};

/**
 * INSTANCE METHODS
 *
 * Methods available on individual message documents
 */
MessageSchema.methods = {
  /**
   * Soft delete a message (hide it but keep in database)
   */
  softDelete() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
  },

  /**
   * Convert message to a clean format for Socket.IO broadcasting
   */
  toSocketFormat() {
    return {
      id: this._id.toString(),
      content: this.content,
      senderId: this.senderId.toString(),
      senderName: this.senderName,
      groupId: this.groupId.toString(),
      timestamp: this.createdAt,
      type: this.type,
      isEdited: this.isEdited,
      replyToMessageId: this.replyToMessageId?.toString() || null,
    };
  },
};

export type MessageDoc = InferSchemaType<typeof MessageSchema>;
export default model<MessageDoc>("Message", MessageSchema);
