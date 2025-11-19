import { Router } from "express";
import { z } from "zod";
import Group from "../models/Groups.js";
import User from "../models/User.js";
import GroupInvitation from "../models/GroupInvitations.js";
import { requireAuth } from "../middleware/requireAuth.js";
import type { Request, Response } from "express";

const router = Router();

// Extend Request type to include user from auth middleware
interface AuthRequest extends Request {
  user?: { id: string };
}

// INVITATION SYSTEM: Zod schemas for invitation responses
const RespondToInvitationSchema = z.object({
  action: z.enum(["accept", "decline"]),
  message: z.string().max(500).optional(),
});

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * GET /invitations/me
 * Get current user's pending invitations
 */
router.get("/me", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find all pending invitations for this user's email
    const pendingInvitations = await GroupInvitation.findPendingForUser(
      user.email
    );

    return res.status(200).json({
      message: "Pending invitations retrieved successfully",
      invitations: pendingInvitations.map((inv: any) => ({
        id: inv._id,
        group: {
          id: inv.groupId._id,
          name: inv.groupId.name,
          description: inv.groupId.description,
          type: inv.groupId.type,
        },
        inviter: {
          id: inv.inviterUserId._id,
          name: inv.inviterUserId.name,
          email: inv.inviterUserId.email,
        },
        message: inv.message,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching user invitations:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /invitations/:invitationId/respond
 * Accept or decline an invitation
 */
router.post(
  "/:invitationId/respond",
  async (req: AuthRequest, res: Response) => {
    try {
      const { invitationId } = req.params;
      const userId = req.user?.id;
      const { action, message } = RespondToInvitationSchema.parse(req.body);

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!invitationId) {
        return res.status(400).json({ message: "Invitation ID is required" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const invitation = await GroupInvitation.findById(invitationId)
        .populate("groupId")
        .populate("inviterUserId", "name email");

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      // Verify this invitation is for the current user
      if (invitation.inviteeEmail !== user.email) {
        return res.status(403).json({
          message: "Access denied: This invitation is not for you",
        });
      }

      // Check if invitation can be responded to
      if (!invitation.canRespond()) {
        return res.status(400).json({
          message: `Cannot respond to invitation with status: ${invitation.status}`,
        });
      }

      const group = invitation.groupId as any;
      if (!group) {
        return res.status(404).json({ message: "Associated group not found" });
      }

      // Process the response
      invitation.status = action === "accept" ? "accepted" : "declined";
      invitation.respondedAt = new Date();
      if (action === "accept") {
        invitation.acceptedAt = new Date();
      }

      if (action === "accept") {
        // Add user to group members
        const newMember = {
          id: userId,
          name: user.name,
          email: user.email,
          role: "member", // Default role for invited members
        };

        group.members = group.members || [];
        (group.members as any).push(newMember);

        // Add group to user's groups
        user.groups = user.groups || [];
        if (!(user.groups as any).includes(group._id)) {
          (user.groups as any).push(group._id);
        }

        await group.save();
        await user.save();
      }

      await invitation.save();

      // INVITATION SYSTEM: Clean up pending invitation references
      // Remove from group's pending invitations
      group.pendingInvitations =
        (group.pendingInvitations as any)?.filter(
          (id: any) => id.toString() !== invitationId
        ) || [];
      await group.save();

      // Remove from user's pending invitations
      user.pendingInvitations =
        (user.pendingInvitations as any)?.filter(
          (id: any) => id.toString() !== invitationId
        ) || [];
      await user.save();

      const responseMessage =
        action === "accept"
          ? "Invitation accepted successfully. You are now a member of the group!"
          : "Invitation declined successfully.";

      return res.status(200).json({
        message: responseMessage,
        invitation: {
          id: invitation._id,
          group: {
            id: group._id,
            name: group.name,
            description: group.description,
            type: group.type,
          },
          action: action,
          respondedAt: invitation.respondedAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.issues,
        });
      }
      console.error("Error responding to invitation:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /invitations/:invitationId
 * Get invitation details (for the invitee to review before responding)
 */
router.get("/:invitationId", async (req: AuthRequest, res: Response) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!invitationId) {
      return res.status(400).json({ message: "Invitation ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const invitation = await GroupInvitation.findById(invitationId)
      .populate("groupId", "name description type")
      .populate("inviterUserId", "name email");

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Verify this invitation is for the current user
    if (invitation.inviteeEmail !== user.email) {
      return res.status(403).json({
        message: "Access denied: This invitation is not for you",
      });
    }

    return res.status(200).json({
      message: "Invitation details retrieved successfully",
      invitation: {
        id: invitation._id,
        group: invitation.groupId,
        inviter: invitation.inviterUserId,
        message: invitation.message,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        canRespond: invitation.canRespond(),
        isExpired: invitation.isExpired(),
      },
    });
  } catch (error) {
    console.error("Error fetching invitation details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
