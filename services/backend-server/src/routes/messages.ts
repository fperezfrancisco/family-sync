import { Router, type Request, type Response } from "express";
import Message from "../models/Messages.js";
import Group from "../models/Groups.js";
import { requireAuth } from "../middleware/requireAuth.js";

/**
 * MESSAGES API ROUTES
 *
 * Purpose: REST API endpoints for message management and history retrieval
 *
 * Endpoints:
 * - GET /messages/:groupId - Get message history for a group
 * - DELETE /messages/:messageId - Delete a specific message
 * - GET /messages/:groupId/count - Get message count for a group
 *
 * All endpoints require authentication via JWT token
 */

interface AuthRequest extends Request {
  user?: { id: string };
}

const router = Router();

/**
 * GET /api/messages/:groupId
 *
 * Retrieve message history for a specific group with pagination support
 *
 * Query Parameters:
 * - limit: Number of messages to return (default: 50, max: 100)
 * - before: ISO date string to get messages before this timestamp (pagination)
 *
 * Example: GET /api/messages/64a1b2c3d4e5f6789012345?limit=20&before=2024-11-20T10:30:00Z
 */
router.get(
  "/:groupId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { groupId } = req.params;
      const { limit = "50", before } = req.query;

      // Validate and sanitize inputs
      const messageLimit = Math.min(parseInt(limit as string) || 50, 100);
      const beforeDate = before ? new Date(before as string) : undefined;

      // Verify user has access to this group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }

      // Check if user is a member of the group
      const isMember = group.members.some(
        (member) => member.id.toString() === req.user?.id
      );

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You are not a member of this group",
        });
      }

      // Fetch messages using our static method
      const messages = await (Message as any).getGroupMessages(
        groupId,
        messageLimit,
        beforeDate
      );

      // Convert to socket format and reverse order (oldest first for display)
      const formattedMessages = messages.reverse().map((msg: any) => ({
        id: msg._id.toString(),
        content: msg.content,
        senderId: msg.senderId.toString(),
        senderName: msg.senderName,
        groupId: msg.groupId.toString(),
        timestamp: msg.createdAt,
        type: msg.type,
        isEdited: msg.isEdited,
        replyToMessageId: msg.replyToMessageId?.toString() || null,
      }));

      res.json({
        success: true,
        data: {
          messages: formattedMessages,
          count: messages.length,
          hasMore: messages.length === messageLimit,
          // Provide pagination cursor for next request
          nextCursor: messages.length > 0 ? messages[0].createdAt : null,
        },
      });
    } catch (error) {
      console.error("❌ Error fetching message history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch message history",
      });
    }
  }
);

/**
 * DELETE /api/messages/:messageId
 *
 * Soft delete a specific message (only message sender or group owner can delete)
 */
router.delete(
  "/:messageId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { messageId } = req.params;
      const userId = req.user?.id;

      // Find the message
      const message = await Message.findById(messageId);
      if (!message || message.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      // Check permissions: sender can delete their own messages
      if (message.senderId.toString() !== userId) {
        // Also check if user is group owner/admin
        const group = await Group.findById(message.groupId);
        if (!group) {
          return res.status(404).json({
            success: false,
            message: "Group not found",
          });
        }

        const userMember = group.members.find(
          (member) => member.id.toString() === userId
        );

        if (
          !userMember ||
          !["owner", "admin"].includes((userMember as any).role)
        ) {
          return res.status(403).json({
            success: false,
            message: "Access denied: You can only delete your own messages",
          });
        }
      }

      // Perform soft delete
      await (message as any).softDelete();

      res.json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete message",
      });
    }
  }
);

/**
 * GET /api/messages/:groupId/count
 *
 * Get total message count for a group (useful for analytics/badges)
 */
router.get(
  "/:groupId/count",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { groupId } = req.params;

      // Verify group access (same as above)
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }

      const isMember = group.members.some(
        (member) => member.id.toString() === req.user?.id
      );

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You are not a member of this group",
        });
      }

      // Get message count
      const count = await Message.countDocuments({
        groupId,
        isDeleted: false,
      });

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      console.error("❌ Error getting message count:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get message count",
      });
    }
  }
);

export default router;
