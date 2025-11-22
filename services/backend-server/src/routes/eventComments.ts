import { Router, type Request, type Response } from "express";
import EventComment from "../models/EventComments.js";
import Event from "../models/Events.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/requireAuth.js";

/**
 * EVENT COMMENTS API ROUTES
 *
 * Purpose: REST API endpoints for event comment management
 *
 * Endpoints:
 * - GET /event-comments/:eventId - Get comments for an event
 * - POST /event-comments/:eventId - Create a new comment
 * - PUT /event-comments/:commentId - Update a comment
 * - DELETE /event-comments/:commentId - Delete a comment
 * - PATCH /event-comments/:commentId/like - Toggle like on a comment
 * - GET /event-comments/:eventId/count - Get comment count for an event
 *
 * All endpoints require authentication via JWT token
 */

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

const router = Router();

/**
 * GET /api/event-comments/:eventId
 *
 * Retrieve all comments for a specific event with replies
 *
 * Query Parameters:
 * - limit: Number of top-level comments to return (default: 50, max: 100)
 *
 * Returns comments in threaded format with replies nested under parents
 */
router.get(
  "/:eventId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      const { limit = "50" } = req.query;

      // Validate and sanitize inputs
      const commentLimit = Math.min(parseInt(limit as string) || 50, 100);

      // Verify event exists and user has access
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      // Check if user has access to this event
      // For now, we'll allow access if user is attendee or owner
      const isOwner = event.owner?.id?.toString() === req.user?.id;
      const isAttendee = event.attendees?.some(
        (attendee: any) => attendee.user.toString() === req.user?.id
      );

      if (!isOwner && !isAttendee) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied: You don't have permission to view these comments",
        });
      }

      // Fetch comments using our static method
      const comments = await (EventComment as any).getEventComments(
        eventId,
        commentLimit
      );

      // Get user's like status for all comments
      const userLikeStatus = await (EventComment as any).getUserLikeStatus(
        eventId,
        req.user?.id
      );

      // Format comments for API response
      const formattedComments = comments.map((comment: any) => ({
        ...comment,
        id: comment._id.toString(),
        author: {
          id: comment.author.id.toString(),
          name: comment.author.name,
          email: comment.author.email,
        },
        eventId: comment.eventId.toString(),
        parentCommentId: comment.parentCommentId?.toString() || null,
        isLikedByUser: userLikeStatus[comment._id.toString()] || false,
        replies:
          comment.replies?.map((reply: any) => ({
            ...reply,
            id: reply._id.toString(),
            author: {
              id: reply.author.id.toString(),
              name: reply.author.name,
              email: reply.author.email,
            },
            parentCommentId: reply.parentCommentId.toString(),
            isLikedByUser: userLikeStatus[reply._id.toString()] || false,
          })) || [],
      }));

      res.json({
        success: true,
        data: {
          comments: formattedComments,
          count: comments.length,
        },
      });
    } catch (error) {
      console.error("❌ Error fetching event comments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch comments",
      });
    }
  }
);

/**
 * POST /api/event-comments/:eventId
 *
 * Create a new comment for an event
 *
 * Body:
 * - content: Comment text (required)
 * - parentCommentId: ID of parent comment if this is a reply (optional)
 */
router.post(
  "/:eventId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      const { content, parentCommentId } = req.body;

      // Validate input
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Comment content is required",
        });
      }

      if (content.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Comment content cannot exceed 2000 characters",
        });
      }

      // Verify event exists and user has access
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      const isOwner = event.owner?.id?.toString() === req.user?.id;
      const isAttendee = event.attendees?.some(
        (attendee: any) => attendee.user.toString() === req.user?.id
      );

      if (!isOwner && !isAttendee) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You must be an attendee to comment",
        });
      }

      // If this is a reply, verify parent comment exists
      if (parentCommentId) {
        const parentComment = await EventComment.findById(parentCommentId);
        if (!parentComment || parentComment.eventId.toString() !== eventId) {
          return res.status(400).json({
            success: false,
            message: "Invalid parent comment",
          });
        }
      }

      // Fetch user data for the author field
      const user = await User.findById(req.user?.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Create the comment
      const newComment = new EventComment({
        content: content.trim(),
        author: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        eventId,
        parentCommentId: parentCommentId || null,
      });

      await newComment.save();

      // Return the formatted comment
      const formattedComment = (newComment as any).toAPIFormat();

      res.status(201).json({
        success: true,
        data: {
          comment: {
            ...formattedComment,
            isLikedByUser: false, // New comment, user hasn't liked it yet
          },
        },
        message: "Comment created successfully",
      });
    } catch (error) {
      console.error("❌ Error creating comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create comment",
      });
    }
  }
);

/**
 * PUT /api/event-comments/:commentId
 *
 * Update a comment (only author can update)
 *
 * Body:
 * - content: Updated comment text (required)
 */
router.put(
  "/:commentId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;

      // Validate input
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Comment content is required",
        });
      }

      if (content.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Comment content cannot exceed 2000 characters",
        });
      }

      // Find the comment
      const comment = await EventComment.findById(commentId);
      if (!comment || comment.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      // Check if user is the author
      if (comment.author?.id?.toString() !== req.user?.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You can only edit your own comments",
        });
      }

      // Update the comment
      comment.content = content.trim();
      comment.isEdited = true;
      comment.editedAt = new Date();

      await comment.save();

      // Return the updated comment
      const formattedComment = (comment as any).toAPIFormat();

      res.json({
        success: true,
        data: {
          comment: formattedComment,
        },
        message: "Comment updated successfully",
      });
    } catch (error) {
      console.error("❌ Error updating comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update comment",
      });
    }
  }
);

/**
 * DELETE /api/event-comments/:commentId
 *
 * Soft delete a comment (only author or event owner can delete)
 */
router.delete(
  "/:commentId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { commentId } = req.params;

      // Find the comment
      const comment = await EventComment.findById(commentId);
      if (!comment || comment.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      // Check permissions: author can delete their comment
      let canDelete = comment.author?.id?.toString() === req.user?.id;

      // Or event owner can delete any comment
      if (!canDelete) {
        const event = await Event.findById(comment.eventId);
        if (event && event.owner?.id?.toString() === req.user?.id) {
          canDelete = true;
        }
      }

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You can only delete your own comments",
        });
      }

      // Perform soft delete
      await (comment as any).softDelete();

      res.json({
        success: true,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete comment",
      });
    }
  }
);

/**
 * PATCH /api/event-comments/:commentId/like
 *
 * Toggle like on a comment
 */
router.patch(
  "/:commentId/like",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { commentId } = req.params;

      // Find the comment
      const comment = await EventComment.findById(commentId);
      if (!comment || comment.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      // Verify user has access to the event
      const event = await Event.findById(comment.eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      const isOwner = event.owner?.id?.toString() === req.user?.id;
      const isAttendee = event.attendees?.some(
        (attendee: any) => attendee.user.toString() === req.user?.id
      );

      if (!isOwner && !isAttendee) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You must be an attendee to like comments",
        });
      }

      // Toggle the like
      const wasLiked = (comment as any).isLikedByUser(req.user?.id);
      await (comment as any).toggleLike(req.user?.id);

      res.json({
        success: true,
        data: {
          commentId: comment._id.toString(),
          likeCount: comment.likeCount,
          isLikedByUser: !wasLiked,
        },
        message: wasLiked ? "Like removed" : "Comment liked",
      });
    } catch (error) {
      console.error("❌ Error toggling comment like:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle like",
      });
    }
  }
);

/**
 * GET /api/event-comments/:eventId/count
 *
 * Get total comment count for an event
 */
router.get(
  "/:eventId/count",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.params;

      // Verify event exists and user has access
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      const isOwner = event.owner?.id?.toString() === req.user?.id;
      const isAttendee = event.attendees?.some(
        (attendee: any) => attendee.user.toString() === req.user?.id
      );

      if (!isOwner && !isAttendee) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied: You don't have permission to view comment count",
        });
      }

      // Get comment count
      const count = await (EventComment as any).getEventCommentCount(eventId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      console.error("❌ Error getting comment count:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get comment count",
      });
    }
  }
);

export default router;
