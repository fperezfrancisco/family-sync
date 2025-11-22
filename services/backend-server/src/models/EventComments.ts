import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * EVENT COMMENT MODEL
 *
 * Purpose: Store comments and replies for events (not real-time chat)
 *
 * Features:
 * - Event-specific commenting system
 * - Like/reaction functionality
 * - Reply threading support (parent-child structure)
 * - Soft delete capability
 * - Optimized queries with indexes
 * - Author information for display
 */

const EventCommentSchema = new Schema(
  {
    // Comment content and basic info
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // Author information
    author: {
      id: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true }, // Denormalized for performance
      email: { type: String, required: true }, // Denormalized for performance
    },

    // Event reference
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    // Reply/threading functionality
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "EventComment",
      default: null, // null = top-level comment, otherwise it's a reply
    },

    // Like/reaction system
    likes: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        likedAt: { type: Date, default: Date.now },
      },
    ],
    likeCount: { type: Number, default: 0 }, // Denormalized for performance

    // Comment status and moderation
    isDeleted: { type: Boolean, default: false }, // Soft delete
    deletedAt: { type: Date, default: null },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },

    // Optional: Comment visibility (for moderation)
    isHidden: { type: Boolean, default: false },
    hiddenReason: { type: String, default: null },

    // Metadata for sorting and organization
    level: { type: Number, default: 0 }, // 0 = top-level, 1+ = reply depth
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    versionKey: false, // Remove __v field
  }
);

/**
 * DATABASE INDEXES
 *
 * Optimize common query patterns:
 * 1. Finding comments by event (primary use case)
 * 2. Finding replies to a specific comment
 * 3. Sorting by creation time
 * 4. User-specific queries for likes/ownership
 */
EventCommentSchema.index({ eventId: 1, createdAt: -1 }); // Primary: get event comments by time
EventCommentSchema.index({ eventId: 1, parentCommentId: 1 }); // Get replies for a comment
EventCommentSchema.index({ parentCommentId: 1, createdAt: 1 }); // Sort replies chronologically
EventCommentSchema.index({ "author.id": 1 }); // User's comments
EventCommentSchema.index({ "likes.userId": 1 }); // User's likes
EventCommentSchema.index({ createdAt: -1 }); // General time-based queries

/**
 * STATIC METHODS
 *
 * Convenient methods for common operations
 */
EventCommentSchema.statics = {
  /**
   * Get all comments for an event with proper threading
   * @param eventId - Event to fetch comments for
   * @param limit - Number of top-level comments to return (default: 50)
   */
  async getEventComments(eventId: string, limit: number = 50) {
    // Get top-level comments first
    const topLevelComments = await this.find({
      eventId,
      parentCommentId: null,
      isDeleted: false,
      isHidden: false,
    })
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .lean();

    // Get all replies for these comments
    const commentIds = topLevelComments.map((comment: any) => comment._id);
    const replies = await this.find({
      parentCommentId: { $in: commentIds },
      isDeleted: false,
      isHidden: false,
    })
      .sort({ createdAt: 1 }) // Oldest first for replies
      .lean();

    // Group replies by parent comment
    const repliesByParent = replies.reduce(
      (acc: Record<string, any[]>, reply: any) => {
        const parentId = reply.parentCommentId.toString();
        if (!acc[parentId]) {
          acc[parentId] = [];
        }
        acc[parentId].push(reply);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Attach replies to their parent comments
    const commentsWithReplies = topLevelComments.map((comment: any) => ({
      ...comment,
      replies: repliesByParent[comment._id.toString()] || [],
    }));

    return commentsWithReplies;
  },

  /**
   * Get comment count for an event
   * @param eventId - Event to count comments for
   */
  async getEventCommentCount(eventId: string) {
    return this.countDocuments({
      eventId,
      isDeleted: false,
      isHidden: false,
    });
  },

  /**
   * Get user's like status for comments in an event
   * @param eventId - Event ID
   * @param userId - User ID to check likes for
   */
  async getUserLikeStatus(eventId: string, userId: string) {
    const comments = await this.find(
      { eventId, isDeleted: false },
      { _id: 1, likes: 1 }
    ).lean();

    const likeStatus: Record<string, boolean> = {};
    comments.forEach((comment: any) => {
      likeStatus[comment._id.toString()] = comment.likes.some(
        (like: any) => like.userId.toString() === userId
      );
    });

    return likeStatus;
  },
};

/**
 * INSTANCE METHODS
 *
 * Methods available on individual comment documents
 */
EventCommentSchema.methods = {
  /**
   * Soft delete a comment
   */
  softDelete() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
  },

  /**
   * Toggle like on a comment
   * @param userId - User toggling the like
   */
  async toggleLike(userId: string) {
    const existingLike = this.likes.find(
      (like: any) => like.userId.toString() === userId
    );

    if (existingLike) {
      // Remove like
      this.likes = this.likes.filter(
        (like: any) => like.userId.toString() !== userId
      );
      this.likeCount = Math.max(0, this.likeCount - 1);
    } else {
      // Add like
      this.likes.push({
        userId,
        likedAt: new Date(),
      });
      this.likeCount += 1;
    }

    return this.save();
  },

  /**
   * Check if user has liked this comment
   * @param userId - User to check
   */
  isLikedByUser(userId: string) {
    return this.likes.some((like: any) => like.userId.toString() === userId);
  },

  /**
   * Convert comment to API response format
   */
  toAPIFormat() {
    return {
      id: this._id.toString(),
      content: this.content,
      author: {
        id: this.author.id.toString(),
        name: this.author.name,
        email: this.author.email,
      },
      eventId: this.eventId.toString(),
      parentCommentId: this.parentCommentId?.toString() || null,
      likeCount: this.likeCount,
      isEdited: this.isEdited,
      editedAt: this.editedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      level: this.level,
      // Note: Individual like details are not exposed for privacy
    };
  },
};

/**
 * PRE-SAVE MIDDLEWARE
 */
EventCommentSchema.pre("save", function (next) {
  // Update like count when likes array changes
  if (this.isModified("likes")) {
    this.likeCount = this.likes.length;
  }

  // Set comment level based on parent
  if (this.isModified("parentCommentId") && this.parentCommentId) {
    // For simplicity, we'll set all replies to level 1
    // In a more complex system, you could implement deeper nesting
    this.level = 1;
  } else if (!this.parentCommentId) {
    this.level = 0;
  }

  next();
});

export type EventCommentDoc = InferSchemaType<typeof EventCommentSchema>;
export default model<EventCommentDoc>("EventComment", EventCommentSchema);
