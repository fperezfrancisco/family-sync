import UserGroupReadState from "../models/UserGroupReadState.js";
import Message from "../models/Messages.js";

/**
 * READ STATE SERVICE
 *
 * Purpose: Manage user read states for groups with cross-device synchronization
 *
 * Features:
 * - Server-side timestamp authority (handles clock sync issues)
 * - Offline reading support with conflict resolution
 * - Efficient unread count calculations
 * - Cross-device read state synchronization
 */

export interface ReadStateUpdate {
  groupId: string;
  timestamp: Date;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
  };
}

export interface UnreadCount {
  groupId: string;
  unreadCount: number;
  lastMessageTimestamp?: Date | null;
}

class ReadStateService {
  /**
   * Get read state for a specific user/group combination
   */
  async getReadState(userId: string, groupId: string) {
    try {
      return await UserGroupReadState.getReadState(userId, groupId);
    } catch (error) {
      console.error(
        `❌ Error getting read state for user ${userId}, group ${groupId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get all read states for a user (used on login/connection)
   * Returns map of groupId -> lastReadTimestamp
   */
  async getUserReadStates(userId: string): Promise<Record<string, Date>> {
    try {
      return await UserGroupReadState.getUserReadStates(userId);
    } catch (error) {
      console.error(`❌ Error getting user read states for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update read state for a user/group combination
   * Handles clock sync by using server timestamp as authority
   */
  async updateReadState(
    userId: string,
    groupId: string,
    clientTimestamp: Date,
    deviceInfo?: { userAgent?: string; platform?: string }
  ) {
    try {
      const result = await UserGroupReadState.updateReadState(
        userId,
        groupId,
        clientTimestamp,
        deviceInfo
      );

      console.log(
        `✅ Updated read state for user ${userId}, group ${groupId}:`,
        {
          clientTimestamp: clientTimestamp.toISOString(),
          serverTimestamp: result.lastReadTimestamp.toISOString(),
          device: deviceInfo?.platform || "unknown",
        }
      );

      return result;
    } catch (error) {
      console.error(
        `❌ Error updating read state for user ${userId}, group ${groupId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Bulk update read states (for offline sync scenarios)
   */
  async bulkUpdateReadStates(
    userId: string,
    readStateUpdates: ReadStateUpdate[]
  ): Promise<number> {
    try {
      const updates = readStateUpdates.map(({ groupId, timestamp }) => ({
        groupId,
        timestamp,
      }));

      const modifiedCount = await UserGroupReadState.bulkUpdateReadStates(
        userId,
        updates
      );

      console.log(
        `✅ Bulk updated ${modifiedCount} read states for user ${userId}`,
        { updateCount: readStateUpdates.length }
      );

      return modifiedCount;
    } catch (error) {
      console.error(
        `❌ Error bulk updating read states for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Calculate unread message counts for user's groups
   * @param userId - User ID
   * @param groupIds - Array of group IDs to check (optional, gets all if not provided)
   */
  async calculateUnreadCounts(
    userId: string,
    groupIds?: string[]
  ): Promise<UnreadCount[]> {
    try {
      // Get user's read states
      const readStates = await this.getUserReadStates(userId);

      // If specific groups requested, filter to those
      const targetGroups = groupIds || Object.keys(readStates);

      const unreadCounts: UnreadCount[] = [];

      for (const groupId of targetGroups) {
        const lastReadTimestamp = readStates[groupId];

        if (!lastReadTimestamp) {
          // No read state = all messages are unread
          // Count all messages in the group EXCEPT user's own messages
          const totalCount = await Message.countDocuments({
            groupId,
            isDeleted: false,
            senderId: { $ne: userId }, // Exclude user's own messages
          });

          // Get latest message timestamp
          const latestMessage = await Message.findOne(
            { groupId, isDeleted: false },
            { createdAt: 1 },
            { sort: { createdAt: -1 } }
          );

          unreadCounts.push({
            groupId,
            unreadCount: totalCount,
            lastMessageTimestamp: latestMessage?.createdAt || null,
          });
        } else {
          // Count messages after last read timestamp EXCEPT user's own messages
          const unreadCount = await Message.countDocuments({
            groupId,
            isDeleted: false,
            createdAt: { $gt: lastReadTimestamp },
            senderId: { $ne: userId }, // Exclude user's own messages
          });

          // Get latest message timestamp for this group
          const latestMessage = await Message.findOne(
            { groupId, isDeleted: false },
            { createdAt: 1 },
            { sort: { createdAt: -1 } }
          );

          unreadCounts.push({
            groupId,
            unreadCount,
            lastMessageTimestamp: latestMessage?.createdAt || null,
          });
        }
      }

      console.log(`📊 Calculated unread counts for user ${userId}:`, {
        groupCount: unreadCounts.length,
        totalUnread: unreadCounts.reduce(
          (sum, { unreadCount }) => sum + unreadCount,
          0
        ),
      });

      return unreadCounts;
    } catch (error) {
      console.error(
        `❌ Error calculating unread counts for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Mark all messages in a group as read (convenience method)
   */
  async markGroupAsRead(
    userId: string,
    groupId: string,
    deviceInfo?: { userAgent?: string; platform?: string }
  ) {
    try {
      // Use current server time as read timestamp
      const currentTime = new Date();
      return await this.updateReadState(
        userId,
        groupId,
        currentTime,
        deviceInfo
      );
    } catch (error) {
      console.error(
        `❌ Error marking group ${groupId} as read for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Handle offline read state synchronization
   * Resolves conflicts by taking the most recent timestamp for each group
   */
  async syncOfflineReadStates(
    userId: string,
    offlineReadStates: ReadStateUpdate[]
  ): Promise<{
    synced: number;
    conflicts: number;
    errors: string[];
  }> {
    const result = {
      synced: 0,
      conflicts: 0,
      errors: [] as string[],
    };

    try {
      // Get current server-side read states
      const serverReadStates = await this.getUserReadStates(userId);

      // Process each offline read state
      const resolvedUpdates: ReadStateUpdate[] = [];

      for (const offlineState of offlineReadStates) {
        try {
          const serverTimestamp = serverReadStates[offlineState.groupId];

          if (!serverTimestamp || offlineState.timestamp > serverTimestamp) {
            // Offline state is newer or no server state exists - accept it
            resolvedUpdates.push(offlineState);
          } else {
            // Server state is newer - conflict detected but we keep server state
            result.conflicts++;
            console.log(
              `⚠️ Read state conflict for group ${offlineState.groupId}:`,
              {
                offline: offlineState.timestamp.toISOString(),
                server: serverTimestamp.toISOString(),
                resolution: "kept_server_state",
              }
            );
          }
        } catch (error) {
          result.errors.push(`Group ${offlineState.groupId}: ${error}`);
        }
      }

      // Apply resolved updates
      if (resolvedUpdates.length > 0) {
        result.synced = await this.bulkUpdateReadStates(
          userId,
          resolvedUpdates
        );
      }

      console.log(`🔄 Offline sync completed for user ${userId}:`, {
        attempted: offlineReadStates.length,
        synced: result.synced,
        conflicts: result.conflicts,
        errors: result.errors.length,
      });
    } catch (error) {
      console.error(
        `❌ Error syncing offline read states for user ${userId}:`,
        error
      );
      result.errors.push(`Sync error: ${error}`);
    }

    return result;
  }

  /**
   * Clean up read states for deleted groups or users
   */
  async cleanup(options: { groupId?: string; userId?: string }) {
    try {
      return await UserGroupReadState.cleanup(options.groupId, options.userId);
    } catch (error) {
      console.error("❌ Error cleaning up read states:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const readStateService = new ReadStateService();
export default ReadStateService;
