import { Schema, model, type InferSchemaType, Model } from "mongoose";

/**
 * USER GROUP READ STATE MODEL
 *
 * Purpose: Track when users last read messages in each group for accurate unread counts
 *
 * Features:
 * - Cross-device read state synchronization
 * - Server-side timestamp authority (handles clock sync issues)
 * - Efficient upsert operations for real-time updates
 * - Optimized indexes for fast lookups
 * - Handles offline reading scenarios
 */

const UserGroupReadStateSchema = new Schema(
  {
    // Core identifiers
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },

    // Read state tracking
    lastReadTimestamp: {
      type: Date,
      required: true,
      // Default to account creation time to prevent all history showing as unread
      default: Date.now,
    },

    // Optional: For more precise tracking (future enhancement)
    lastReadMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // Metadata for debugging and analytics
    lastDeviceInfo: {
      userAgent: { type: String, default: null },
      platform: { type: String, default: null }, // 'web', 'mobile', etc.
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    versionKey: false, // Optimize document size
  }
);

/**
 * DATABASE INDEXES
 *
 * Optimized for the most common query patterns:
 * 1. Get read state for specific user/group combination (primary use case)
 * 2. Get all read states for a user (on login)
 * 3. Cleanup operations
 */

// Composite unique index - ensures one read state record per user/group pair
UserGroupReadStateSchema.index({ userId: 1, groupId: 1 }, { unique: true });

// User-focused index for getting all user's read states on login
UserGroupReadStateSchema.index({ userId: 1, updatedAt: -1 });

// Group-focused index for potential group analytics
UserGroupReadStateSchema.index({ groupId: 1, updatedAt: -1 });

/**
 * STATIC METHODS INTERFACE
 */
interface UserGroupReadStateModel extends Model<UserGroupReadStateDoc> {
  getReadState(
    userId: string,
    groupId: string
  ): Promise<UserGroupReadStateDoc | null>;
  getUserReadStates(userId: string): Promise<Record<string, Date>>;
  updateReadState(
    userId: string,
    groupId: string,
    clientTimestamp: Date,
    deviceInfo?: { userAgent?: string; platform?: string }
  ): Promise<UserGroupReadStateDoc>;
  bulkUpdateReadStates(
    userId: string,
    readStateUpdates: Array<{ groupId: string; timestamp: Date }>
  ): Promise<number>;
  cleanup(groupId?: string, userId?: string): Promise<number>;
}

/**
 * STATIC METHODS
 *
 * Efficient operations for read state management
 */
UserGroupReadStateSchema.statics = {
  /**
   * Get read state for a specific user/group combination
   * @param userId - User ID
   * @param groupId - Group ID
   * @returns Read state document or null if not found
   */
  async getReadState(userId: string, groupId: string) {
    return this.findOne({ userId, groupId }).lean();
  },

  /**
   * Get all read states for a user (used on login)
   * @param userId - User ID
   * @returns Map of groupId -> lastReadTimestamp
   */
  async getUserReadStates(userId: string): Promise<Record<string, Date>> {
    const readStates = await this.find({ userId })
      .select("groupId lastReadTimestamp")
      .lean();

    const readStateMap: Record<string, Date> = {};
    readStates.forEach((state: any) => {
      readStateMap[state.groupId.toString()] = state.lastReadTimestamp;
    });

    return readStateMap;
  },

  /**
   * Update read state with upsert (create if doesn't exist, update if it does)
   * Uses server timestamp to handle clock sync issues
   * @param userId - User ID
   * @param groupId - Group ID
   * @param clientTimestamp - Timestamp from client (for reference)
   * @param deviceInfo - Optional device information
   * @returns Updated read state document
   */
  async updateReadState(
    userId: string,
    groupId: string,
    clientTimestamp: Date,
    deviceInfo?: { userAgent?: string; platform?: string }
  ) {
    // Use server timestamp as authoritative source
    const serverTimestamp = new Date();

    // For offline scenarios: use the later of client or server timestamp
    // This handles cases where user reads messages offline and syncs later
    const lastReadTimestamp =
      clientTimestamp > serverTimestamp ? clientTimestamp : serverTimestamp;

    const updateData: any = {
      lastReadTimestamp,
      updatedAt: serverTimestamp,
    };

    // Add device info if provided
    if (deviceInfo) {
      updateData.lastDeviceInfo = deviceInfo;
    }

    return this.findOneAndUpdate(
      { userId, groupId },
      { $set: updateData },
      {
        upsert: true,
        new: true, // Return updated document
        setDefaultsOnInsert: true, // Apply schema defaults on insert
      }
    );
  },

  /**
   * Bulk update read states (for offline sync scenarios)
   * @param userId - User ID
   * @param readStateUpdates - Array of { groupId, timestamp } updates
   * @returns Number of documents modified
   */
  async bulkUpdateReadStates(
    userId: string,
    readStateUpdates: Array<{ groupId: string; timestamp: Date }>
  ) {
    const bulkOps = readStateUpdates.map(({ groupId, timestamp }) => ({
      updateOne: {
        filter: { userId, groupId },
        update: {
          $set: {
            lastReadTimestamp: timestamp,
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await this.bulkWrite(bulkOps);
    return result.modifiedCount + result.upsertedCount;
  },

  /**
   * Clean up read states for deleted groups or users
   * @param groupId - Group ID (if group was deleted)
   * @param userId - User ID (if user was deleted)
   */
  async cleanup(groupId?: string, userId?: string) {
    const filter: any = {};
    if (groupId) filter.groupId = groupId;
    if (userId) filter.userId = userId;

    if (Object.keys(filter).length === 0) {
      throw new Error("Must provide either groupId or userId for cleanup");
    }

    const result = await this.deleteMany(filter);
    console.log(`🧹 Cleaned up ${result.deletedCount} read state records`);
    return result.deletedCount;
  },
};

/**
 * INSTANCE METHODS
 *
 * Methods available on individual read state documents
 */
UserGroupReadStateSchema.methods = {
  /**
   * Convert to format suitable for Socket.IO transmission
   */
  toSocketFormat() {
    return {
      groupId: this.groupId.toString(),
      lastReadTimestamp: this.lastReadTimestamp,
      updatedAt: this.updatedAt,
    };
  },

  /**
   * Check if this read state is more recent than a given timestamp
   * @param timestamp - Timestamp to compare against
   */
  isMoreRecentThan(timestamp: Date): boolean {
    return this.lastReadTimestamp > timestamp;
  },
};

export type UserGroupReadStateDoc = InferSchemaType<
  typeof UserGroupReadStateSchema
>;
export default model<UserGroupReadStateDoc, UserGroupReadStateModel>(
  "UserGroupReadState",
  UserGroupReadStateSchema
);
