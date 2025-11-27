import { Router } from "express";
import { z } from "zod";
import Group, {} from "../models/Groups.js";
import User from "../models/User.js";
// INVITATION SYSTEM: Import GroupInvitation model
import GroupInvitation from "../models/GroupInvitations.js";
import { requireAuth } from "../middleware/requireAuth.js";
const router = Router();
// Zod schemas for request validation
const CreateGroupSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    type: z.enum(["family", "friends", "work", "other"]).default("other"),
});
const UpdateGroupSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    type: z.enum(["family", "friends", "work", "other"]).optional(),
});
const AddMemberSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(["admin", "member", "guest"]).default("member"),
});
const UpdateMemberRoleSchema = z.object({
    role: z.enum(["admin", "member", "guest"]),
});
// INVITATION SYSTEM: Zod schemas for invitation endpoints
const CreateInvitationSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
    message: z.string().max(500).optional(),
    role: z.enum(["admin", "member", "guest"]).default("member"),
});
const RespondToInvitationSchema = z.object({
    action: z.enum(["accept", "decline"]),
    message: z.string().max(500).optional(),
});
// Helper function to get user's role in a group
async function getUserRoleInGroup(groupId, userId) {
    if (!userId)
        return null;
    const group = await Group.findById(groupId);
    if (!group)
        return null;
    // Check if user is owner
    if (group.owner.toString() === userId)
        return "owner";
    // Check if user is a member
    const member = group.members.find((m) => m.id.toString() === userId);
    return member ? member.role : null;
}
// Helper function to check if user has permission for an action
function hasPermission(userRole, action, targetRole) {
    const roleHierarchy = { owner: 4, admin: 3, member: 2, guest: 1 };
    switch (action) {
        case "read":
            return ["owner", "admin", "member", "guest"].includes(userRole);
        case "create_event":
            return ["owner", "admin", "member"].includes(userRole);
        case "send_message":
            return ["owner", "admin", "member", "guest"].includes(userRole);
        case "update_group":
            return ["owner", "admin"].includes(userRole);
        case "delete_group":
            return userRole === "owner";
        case "add_member":
            return ["owner", "admin"].includes(userRole);
        // INVITATION SYSTEM: Permission for sending invitations
        case "invite_member":
            return ["owner", "admin"].includes(userRole);
        case "remove_member":
            if (userRole === "owner")
                return true;
            if (userRole === "admin" && targetRole) {
                return (roleHierarchy[targetRole] <
                    roleHierarchy.admin);
            }
            return false;
        case "update_member_role":
            if (userRole === "owner")
                return true;
            if (userRole === "admin" && targetRole) {
                // Admin can only upgrade guest to member, cannot promote to admin or demote admin/owner
                return targetRole === "guest" || targetRole === "member";
            }
            return false;
        default:
            return false;
    }
}
// Apply auth middleware to all routes
router.use(requireAuth);
/**
 * GET /groups
 * Get all groups where user is a member
 */
router.get("/", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const groups = await Group.find({
            $or: [{ owner: userId }, { "members.id": userId }],
        })
            .populate("owner", "name email")
            .sort({ createdAt: -1 });
        return res.status(200).json({
            message: "Groups retrieved successfully",
            groups: groups.map((group) => ({
                id: group._id,
                name: group.name,
                description: group.description,
                type: group.type,
                owner: group.owner,
                members: group.members,
                createdAt: group.createdAt,
                userRole: group.owner.toString() === userId
                    ? "owner"
                    : group.members.find((m) => m.id.toString() === userId)?.role || null,
            })),
        });
    }
    catch (error) {
        console.error("Error fetching groups:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * GET /groups/:groupId
 * Get specific group details
 */
router.get("/:groupId", async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!groupId) {
            return res.status(400).json({ message: "Group ID is required" });
        }
        const group = await Group.findById(groupId).populate("owner", "name email");
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res
                .status(403)
                .json({ message: "Access denied: You are not a member of this group" });
        }
        if (!hasPermission(userRole, "read")) {
            return res
                .status(403)
                .json({ message: "Access denied: Insufficient permissions" });
        }
        return res.status(200).json({
            message: "Group retrieved successfully",
            group: {
                id: group._id,
                name: group.name,
                description: group.description,
                type: group.type,
                owner: group.owner,
                members: group.members,
                createdAt: group.createdAt,
                userRole,
            },
        });
    }
    catch (error) {
        console.error("Error fetching group:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * POST /groups
 * Create a new group
 */
router.post("/", async (req, res) => {
    try {
        const { name, description, type } = CreateGroupSchema.parse(req.body);
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const group = new Group({
            name,
            description,
            type,
            owner: userId,
            members: [
                {
                    id: userId,
                    name: user.name,
                    email: user.email,
                    role: "owner",
                },
            ],
        });
        await group.save();
        await group.populate("owner", "name email");
        //await group.populate("members.user", "name email");
        return res.status(201).json({
            message: "Group created successfully",
            group: {
                id: group._id,
                name: group.name,
                description: group.description,
                type: group.type,
                owner: group.owner,
                members: group.members,
                createdAt: group.createdAt,
                userRole: "owner",
            },
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues,
            });
        }
        console.error("Error creating group:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * PUT /groups/:groupId
 * Update group details
 */
router.put("/:groupId", async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.id;
        const updateData = UpdateGroupSchema.parse(req.body);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!groupId) {
            return res.status(400).json({ message: "Group ID is required" });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res
                .status(403)
                .json({ message: "Access denied: You are not a member of this group" });
        }
        if (!hasPermission(userRole, "update_group")) {
            return res.status(403).json({
                message: "Access denied: Insufficient permissions to update group",
            });
        }
        // Update group
        Object.assign(group, updateData);
        await group.save();
        await group.populate("owner", "name email");
        return res.status(200).json({
            message: "Group updated successfully",
            group: {
                id: group._id,
                name: group.name,
                description: group.description,
                type: group.type,
                owner: group.owner,
                members: group.members,
                createdAt: group.createdAt,
                userRole,
            },
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues,
            });
        }
        console.error("Error updating group:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * DELETE /groups/:groupId
 * Delete a group (owner only)
 */
router.delete("/:groupId", async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!groupId) {
            return res.status(400).json({ message: "Group ID is required" });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res
                .status(403)
                .json({ message: "Access denied: You are not a member of this group" });
        }
        if (!hasPermission(userRole, "delete_group")) {
            return res.status(403).json({
                message: "Access denied: Only group owner can delete the group",
            });
        }
        await Group.findByIdAndDelete(groupId);
        return res.status(200).json({
            message: "Group deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting group:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * POST /groups/:groupId/members
 * Add a member to the group
 */
router.post("/:groupId/members", async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.id;
        const { id: newMemberId, role } = AddMemberSchema.parse(req.body);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        // Verify new member user exists
        const newMember = await User.findById(newMemberId);
        if (!newMember) {
            return res.status(404).json({ message: "User to add not found" });
        }
        if (!groupId) {
            return res.status(400).json({ message: "Group ID is required" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res
                .status(403)
                .json({ message: "Access denied: You are not a member of this group" });
        }
        if (!hasPermission(userRole, "add_member")) {
            return res.status(403).json({
                message: "Access denied: Insufficient permissions to add members",
            });
        }
        // Check if user is already a member
        const existingMember = group.members.find((m) => m.id.toString() === newMemberId);
        if (existingMember) {
            return res
                .status(400)
                .json({ message: "User is already a member of this group" });
        }
        // Add member to group
        group.members.push({
            id: newMemberId,
            name: newMember.name,
            email: newMember.email,
            role,
        });
        await group.save();
        return res.status(200).json({
            message: "Member added successfully",
            member: {
                id: newMemberId,
                name: newMember.name,
                email: newMember.email,
                role,
            },
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues,
            });
        }
        console.error("Error adding member:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * PUT /groups/:groupId/members/:memberId/role
 * Update member role
 */
router.put("/:groupId/members/:memberId/role", async (req, res) => {
    try {
        const { groupId, memberId } = req.params;
        const userId = req.user?.id;
        const { role: newRole } = UpdateMemberRoleSchema.parse(req.body);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        if (!groupId) {
            return res.status(400).json({ message: "Group ID is required" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res.status(403).json({
                message: "Access denied: You are not a member of this group",
            });
        }
        // Find the member to update
        const memberIndex = group.members.findIndex((m) => m.id.toString() === memberId);
        if (memberIndex === -1) {
            return res.status(404).json({ message: "Member not found in group" });
        }
        const currentMemberRole = group.members[memberIndex].role;
        // Check if user cannot modify owner role (though owner shouldn't be in members array)
        if (currentMemberRole === "owner") {
            return res.status(403).json({ message: "Cannot modify owner role" });
        }
        if (!hasPermission(userRole, "update_member_role", currentMemberRole)) {
            return res.status(403).json({
                message: "Access denied: Insufficient permissions to update this member's role",
            });
        }
        // Update member role
        group.members[memberIndex].role = newRole;
        await group.save();
        return res.status(200).json({
            message: "Member role updated successfully",
            member: group.members[memberIndex],
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues,
            });
        }
        console.error("Error updating member role:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * DELETE /groups/:groupId/members/:memberId
 * Remove member from group
 */
router.delete("/:groupId/members/:memberId", async (req, res) => {
    try {
        const { groupId, memberId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!groupId) {
            return res.status(400).json({ message: "Group ID is required" });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res.status(403).json({
                message: "Access denied: You are not a member of this group",
            });
        }
        // Find the member to remove
        const memberIndex = group.members.findIndex((m) => m.id.toString() === memberId);
        if (memberIndex === -1) {
            return res.status(404).json({ message: "Member not found in group" });
        }
        const targetMemberRole = group.members[memberIndex].role;
        // Cannot remove owner (though owner shouldn't be in members array)
        if (targetMemberRole === "owner") {
            return res.status(403).json({ message: "Cannot remove group owner" });
        }
        // Allow users to remove themselves (except owner)
        if (memberId === userId) {
            group.members.splice(memberIndex, 1);
            await group.save();
            return res.status(200).json({ message: "Successfully left the group" });
        }
        if (!hasPermission(userRole, "remove_member", targetMemberRole)) {
            return res.status(403).json({
                message: "Access denied: Insufficient permissions to remove this member",
            });
        }
        // Remove member
        group.members.splice(memberIndex, 1);
        await group.save();
        return res.status(200).json({
            message: "Member removed successfully",
        });
    }
    catch (error) {
        console.error("Error removing member:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * GET /groups/:groupId/members
 * Get all members of a group
 */
router.get("/:groupId/members", async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!groupId) {
            return res.status(400).json({ message: "Group ID is required" });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res
                .status(403)
                .json({ message: "Access denied: You are not a member of this group" });
        }
        if (!hasPermission(userRole, "read")) {
            return res
                .status(403)
                .json({ message: "Access denied: Insufficient permissions" });
        }
        return res.status(200).json({
            message: "Members retrieved successfully",
            members: group.members,
        });
    }
    catch (error) {
        console.error("Error fetching members:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
// INVITATION SYSTEM: Invitation management endpoints
/**
 * POST /groups/:groupId/invitations
 * Create a new group invitation
 */
router.post("/:groupId/invitations", async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.id;
        const { email, message, role } = CreateInvitationSchema.parse(req.body);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!groupId) {
            return res.status(400).json({ message: "Group ID is required" });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res.status(403).json({
                message: "Access denied: You are not a member of this group",
            });
        }
        if (!hasPermission(userRole, "invite_member")) {
            return res.status(403).json({
                message: "Access denied: Insufficient permissions to invite members",
            });
        }
        // Check if email is already a member
        const existingMember = group.members.find((m) => m.email === email);
        if (existingMember) {
            return res.status(400).json({
                message: "User with this email is already a member of the group",
            });
        }
        // Check if there's already a pending invitation for this email
        const existingInvitation = await GroupInvitation.findOne({
            groupId: groupId,
            inviteeEmail: email,
            status: "pending",
        });
        if (existingInvitation) {
            return res.status(400).json({
                message: "There is already a pending invitation for this email",
            });
        }
        // Create invitation
        const invitation = new GroupInvitation({
            groupId: groupId,
            inviterUserId: userId,
            inviteeEmail: email,
            message: message,
            status: "pending",
        });
        await invitation.save();
        // INVITATION SYSTEM: Update group with pending invitation
        group.pendingInvitations = group.pendingInvitations || [];
        group.pendingInvitations.push(invitation._id);
        await group.save();
        // INVITATION SYSTEM: Update user if they exist
        const inviteeUser = await User.findOne({ email: email });
        if (inviteeUser) {
            inviteeUser.pendingInvitations = inviteeUser.pendingInvitations || [];
            inviteeUser.pendingInvitations.push(invitation._id);
            await inviteeUser.save();
        }
        await invitation.populate("groupId", "name type");
        await invitation.populate("inviterUserId", "name email");
        return res.status(201).json({
            message: "Invitation sent successfully",
            invitation: {
                id: invitation._id,
                groupId: invitation.groupId,
                inviterUserId: invitation.inviterUserId,
                inviteeEmail: invitation.inviteeEmail,
                message: invitation.message,
                status: invitation.status,
                createdAt: invitation.createdAt,
                expiresAt: invitation.expiresAt,
            },
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues,
            });
        }
        console.error("Error creating invitation:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * GET /groups/:groupId/invitations
 * Get all invitations for a group (pending, accepted, declined)
 */
router.get("/:groupId/invitations", async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.id;
        const { status } = req.query;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!groupId) {
            return res.status(400).json({ message: "Group ID is required" });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res.status(403).json({
                message: "Access denied: You are not a member of this group",
            });
        }
        if (!hasPermission(userRole, "read")) {
            return res.status(403).json({
                message: "Access denied: Insufficient permissions",
            });
        }
        // Build query filter
        const filter = { groupId: groupId };
        if (status && typeof status === "string") {
            filter.status = status;
        }
        const invitations = await GroupInvitation.find(filter)
            .populate("inviterUserId", "name email")
            .populate("inviteeUserId", "name email")
            .sort({ createdAt: -1 });
        return res.status(200).json({
            message: "Invitations retrieved successfully",
            invitations: invitations.map((inv) => ({
                id: inv._id,
                inviterUser: inv.inviterUserId,
                inviteeEmail: inv.inviteeEmail,
                inviteeUser: inv.inviteeUserId || null,
                message: inv.message,
                status: inv.status,
                createdAt: inv.createdAt,
                expiresAt: inv.expiresAt,
                acceptedAt: inv.acceptedAt,
                respondedAt: inv.respondedAt,
            })),
        });
    }
    catch (error) {
        console.error("Error fetching invitations:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * DELETE /groups/:groupId/invitations/:invitationId
 * Cancel a pending invitation (inviter or group owner/admin only)
 */
router.delete("/:groupId/invitations/:invitationId", async (req, res) => {
    try {
        const { groupId, invitationId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!groupId || !invitationId) {
            return res
                .status(400)
                .json({ message: "Group ID and Invitation ID are required" });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const invitation = await GroupInvitation.findById(invitationId);
        if (!invitation) {
            return res.status(404).json({ message: "Invitation not found" });
        }
        if (invitation.groupId.toString() !== groupId) {
            return res
                .status(400)
                .json({ message: "Invitation does not belong to this group" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res.status(403).json({
                message: "Access denied: You are not a member of this group",
            });
        }
        // Allow cancellation if user is the inviter or has invite permissions
        const isInviter = invitation.inviterUserId.toString() === userId;
        const canManageInvitations = hasPermission(userRole, "invite_member");
        if (!isInviter && !canManageInvitations) {
            return res.status(403).json({
                message: "Access denied: You can only cancel invitations you sent",
            });
        }
        if (invitation.status !== "pending") {
            return res.status(400).json({
                message: `Cannot cancel invitation with status: ${invitation.status}`,
            });
        }
        // Update invitation status
        invitation.status = "cancelled";
        invitation.respondedAt = new Date();
        await invitation.save();
        // INVITATION SYSTEM: Remove from group's pending invitations
        group.pendingInvitations =
            group.pendingInvitations?.filter((id) => id.toString() !== invitationId) || [];
        await group.save();
        // INVITATION SYSTEM: Remove from user's pending invitations if they exist
        const inviteeUser = await User.findOne({
            email: invitation.inviteeEmail,
        });
        if (inviteeUser) {
            inviteeUser.pendingInvitations =
                inviteeUser.pendingInvitations?.filter((id) => id.toString() !== invitationId) || [];
            await inviteeUser.save();
        }
        return res.status(200).json({
            message: "Invitation cancelled successfully",
        });
    }
    catch (error) {
        console.error("Error cancelling invitation:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
export default router;
//# sourceMappingURL=groups.js.map