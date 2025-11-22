import Message from "../models/Messages.js";

/**
 * MESSAGE CLEANUP UTILITY
 *
 * Purpose: Automatic cleanup of old messages to maintain database efficiency
 *
 * Features:
 * - Configurable retention period (default: 30 days)
 * - Safe deletion with logging
 * - Can be run manually or on schedule
 * - Statistics reporting
 */

interface CleanupStats {
  deletedCount: number;
  retentionDays: number;
  cutoffDate: Date;
  executionTime: number;
}

/**
 * Clean up messages older than the specified retention period
 *
 * @param retentionDays - Number of days to retain messages (default: 30)
 * @returns Promise<CleanupStats> - Statistics about the cleanup operation
 */
export async function cleanupOldMessages(
  retentionDays: number = 30
): Promise<CleanupStats> {
  const startTime = Date.now();

  try {
    console.log(
      `🧹 Starting message cleanup: removing messages older than ${retentionDays} days...`
    );

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Delete old messages
    const result = await Message.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    const executionTime = Date.now() - startTime;

    const stats: CleanupStats = {
      deletedCount: result.deletedCount || 0,
      retentionDays,
      cutoffDate,
      executionTime,
    };

    console.log(`✅ Message cleanup completed:`, {
      deleted: stats.deletedCount,
      retentionDays: stats.retentionDays,
      cutoffDate: stats.cutoffDate.toISOString(),
      executionTimeMs: stats.executionTime,
    });

    return stats;
  } catch (error) {
    console.error("❌ Error during message cleanup:", error);
    throw error;
  }
}

/**
 * Get statistics about message storage without deleting anything
 *
 * @param retentionDays - Days to use for calculating what would be deleted
 * @returns Promise with storage statistics
 */
export async function getMessageStats(retentionDays: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const [totalMessages, oldMessages, totalGroups] = await Promise.all([
      Message.countDocuments({}),
      Message.countDocuments({ createdAt: { $lt: cutoffDate } }),
      Message.distinct("groupId").then((groups) => groups.length),
    ]);

    const recentMessages = totalMessages - oldMessages;

    return {
      total: totalMessages,
      recent: recentMessages,
      old: oldMessages,
      groups: totalGroups,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
    };
  } catch (error) {
    console.error("❌ Error getting message stats:", error);
    throw error;
  }
}

/**
 * Schedule automatic cleanup to run daily
 *
 * This function sets up a recurring cleanup job that runs every 24 hours
 *
 * @param retentionDays - Number of days to retain messages
 */
export function scheduleMessageCleanup(retentionDays: number = 30) {
  console.log(
    `⏰ Scheduling daily message cleanup (${retentionDays} day retention)...`
  );

  // Run cleanup immediately on startup
  cleanupOldMessages(retentionDays).catch((error) => {
    console.error("❌ Initial message cleanup failed:", error);
  });

  // Schedule to run every 24 hours
  setInterval(async () => {
    try {
      await cleanupOldMessages(retentionDays);
    } catch (error) {
      console.error("❌ Scheduled message cleanup failed:", error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

  console.log("✅ Message cleanup scheduler started");
}

/**
 * Manual cleanup command for testing/maintenance
 *
 * Usage: Import this in a script and call it manually
 */
export async function manualCleanup(retentionDays?: number) {
  console.log("🔧 Running manual message cleanup...");

  try {
    // Show stats first
    const stats = await getMessageStats(retentionDays);
    console.log("📊 Current message statistics:", stats);

    if (stats.old > 0) {
      console.log(
        `⚠️  Found ${stats.old} old messages to delete. Proceeding...`
      );
      const cleanupResult = await cleanupOldMessages(retentionDays);
      console.log("✅ Manual cleanup completed:", cleanupResult);
    } else {
      console.log("✅ No old messages to clean up");
    }
  } catch (error) {
    console.error("❌ Manual cleanup failed:", error);
  }
}
