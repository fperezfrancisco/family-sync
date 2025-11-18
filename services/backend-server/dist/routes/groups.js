import { Router } from "express";
import { z } from "zod";
import Group, {} from "../models/Groups.js";
import User from "../models/User.js";
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
    userId: z.string(),
    role: z.enum(["admin", "member", "guest"]).default("member"),
});
const UpdateMemberRoleSchema = z.object({
    role: z.enum(["admin", "member", "guest"]),
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
    const member = group.members.find((m) => m.user.toString() === userId);
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
        case "remove_member":
            if (userRole === "owner")
                return true;
            if (userRole === "admin" && targetRole) {
                return roleHierarchy[targetRole] < roleHierarchy.admin;
            }
            return false;
        case "update_member_role":
            if (userRole === "owner")
                return true;
            if (userRole === "admin" && targetRole) {
                // Admin can only upgrade guest to member, cannot promote to admin or demote admin/owner
                return targetRole === "guest" || (targetRole === "member");
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
            $or: [
                { owner: userId },
                { "members.user": userId }
            ]
        })
            .populate("owner", "name email")
            .populate("members.user", "name email")
            .sort({ createdAt: -1 });
        return res.status(200).json({
            message: "Groups retrieved successfully",
            groups: groups.map(group => ({
                id: group._id,
                name: group.name,
                description: group.description,
                type: group.type,
                owner: group.owner,
                members: group.members,
                createdAt: group.createdAt,
                userRole: group.owner.toString() === userId
                    ? "owner"
                    : group.members.find((m) => m.user.toString() === userId)?.role || null
            }))
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
        const group = await Group.findById(groupId)
            .populate("owner", "name email")
            .populate("members.user", "name email");
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res.status(403).json({ message: "Access denied: You are not a member of this group" });
        }
        if (!hasPermission(userRole, "read")) {
            return res.status(403).json({ message: "Access denied: Insufficient permissions" });
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
                userRole
            }
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
            members: [{
                    user: userId,
                    role: "owner"
                }]
        });
        await group.save();
        await group.populate("owner", "name email");
        await group.populate("members.user", "name email");
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
                userRole: "owner"
            }
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues
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
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res.status(403).json({ message: "Access denied: You are not a member of this group" });
        }
        if (!hasPermission(userRole, "update_group")) {
            return res.status(403).json({ message: "Access denied: Insufficient permissions to update group" });
        }
        // Update group
        Object.assign(group, updateData);
        await group.save();
        await group.populate("owner", "name email");
        await group.populate("members.user", "name email");
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
                userRole
            }
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues
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
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res.status(403).json({ message: "Access denied: You are not a member of this group" });
        }
        if (!hasPermission(userRole, "delete_group")) {
            return res.status(403).json({ message: "Access denied: Only group owner can delete the group" });
        }
        await Group.findByIdAndDelete(groupId);
        return res.status(200).json({
            message: "Group deleted successfully"
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
        const { userId: newMemberId, role } = AddMemberSchema.parse(req.body);
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
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res.status(403).json({ message: "Access denied: You are not a member of this group" });
        }
        if (!hasPermission(userRole, "add_member")) {
            return res.status(403).json({ message: "Access denied: Insufficient permissions to add members" });
        }
        // Check if user is already a member
        const existingMember = group.members.find((m) => m.user.toString() === newMemberId);
        if (existingMember) {
            return res.status(400).json({ message: "User is already a member of this group" });
        }
        // Add member to group
        group.members.push({
            user: newMemberId,
            role
        });
        await group.save();
        await group.populate("members.user", "name email");
        return res.status(200).json({
            message: "Member added successfully",
            member: {
                user: newMember,
                role
            }
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues
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
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res.status(403).json({ message: "Access denied: You are not a member of this group" });
        }
        // Find the member to update
        const memberIndex = group.members.findIndex((m) => m.user.toString() === memberId);
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
                message: "Access denied: Insufficient permissions to update this member's role"
            });
        }
        // Update member role
        group.members[memberIndex].role = newRole;
        await group.save();
        await group.populate("members.user", "name email");
        return res.status(200).json({
            message: "Member role updated successfully",
            member: group.members[memberIndex]
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues
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
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res.status(403).json({ message: "Access denied: You are not a member of this group" });
        }
        // Find the member to remove
        const memberIndex = group.members.findIndex((m) => m.user.toString() === memberId);
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
                message: "Access denied: Insufficient permissions to remove this member"
            });
        }
        // Remove member
        group.members.splice(memberIndex, 1);
        await group.save();
        return res.status(200).json({
            message: "Member removed successfully"
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
        const group = await Group.findById(groupId).populate("members.user", "name email");
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const userRole = await getUserRoleInGroup(groupId, userId);
        if (!userRole) {
            return res.status(403).json({ message: "Access denied: You are not a member of this group" });
        }
        if (!hasPermission(userRole, "read")) {
            return res.status(403).json({ message: "Access denied: Insufficient permissions" });
        }
        return res.status(200).json({
            message: "Members retrieved successfully",
            members: group.members
        });
    }
    catch (error) {
        console.error("Error fetching members:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
export default router;
//# sourceMappingURL=groups.js.map