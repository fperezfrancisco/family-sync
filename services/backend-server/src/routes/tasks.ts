import { Router } from "express";
import { z } from "zod";
import Task, { type TaskDoc } from "../models/Tasks.js";
import Group from "../models/Groups.js";
import Event from "../models/Events.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/requireAuth.js";
import type { Request, Response } from "express";
import type { Document } from "mongoose";

const router = Router();

// Extend Request type to include user from auth middleware
interface AuthRequest extends Request {
  user?: { id: string };
}

// Zod schemas for request validation
const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  groupId: z.string(),
  eventId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  category: z
    .enum([
      "supplies",
      "logistics",
      "preparation",
      "chores",
      "coordination",
      "other",
    ])
    .default("other"),
  dueDate: z.string().datetime().optional(),
  allowSelfAssign: z.boolean().default(true),
  requiresVerification: z.boolean().default(false),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  category: z
    .enum([
      "supplies",
      "logistics",
      "preparation",
      "chores",
      "coordination",
      "other",
    ])
    .optional(),
  dueDate: z.string().datetime().optional().nullable(),
  allowSelfAssign: z.boolean().optional(),
  requiresVerification: z.boolean().optional(),
  status: z
    .enum([
      "not_started",
      "in_progress",
      "blocked",
      "completed",
      "verified",
      "cancelled",
    ])
    .optional(),
  blockReason: z.string().max(500).optional(),
});

const AssignTaskSchema = z.object({
  assigneeIds: z.array(z.string()),
});

const UpdateStatusSchema = z.object({
  status: z.enum([
    "not_started",
    "in_progress",
    "blocked",
    "completed",
    "verified",
    "cancelled",
  ]),
  comment: z.string().max(1000).optional(),
  blockReason: z.string().max(500).optional(),
});

const AddCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

// Helper function to check if user has permission in group
async function checkGroupPermission(
  groupId: string,
  userId: string
): Promise<{
  hasAccess: boolean;
  role?: "owner" | "admin" | "member" | "guest";
  group?: Document;
}> {
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return { hasAccess: false };
    }

    // Check if user is group owner
    if (group.owner.toString() === userId) {
      return { hasAccess: true, role: "owner", group };
    }

    // Check if user is a member
    const member = group.members.find((m: any) => m.id.toString() === userId);
    if (member) {
      return { hasAccess: true, role: (member as any).role, group };
    }

    return { hasAccess: false };
  } catch (error) {
    return { hasAccess: false };
  }
}

// GET /tasks - Get tasks with filtering and pagination
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      groupId,
      eventId,
      status,
      priority,
      category,
      assignedToMe,
      createdByMe,
      dueDate,
      isOverdue,
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter query
    const filter: any = {};

    // If groupId specified, check permission and filter
    if (groupId) {
      const { hasAccess } = await checkGroupPermission(
        groupId as string,
        userId
      );
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this group" });
      }
      filter["group.id"] = groupId;
    } else {
      // If no specific group, get all groups user has access to
      const userGroups = await Group.find({
        $or: [{ owner: userId }, { "members.id": userId }],
      });

      const groupIds = userGroups.map((g) => g._id);
      filter["group.id"] = { $in: groupIds };
    }

    // Apply additional filters
    if (eventId) filter["event.id"] = eventId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    if (assignedToMe === "true") {
      filter["assignees.id"] = userId;
    }

    if (createdByMe === "true") {
      filter["creator.id"] = userId;
    }

    // Due date filtering
    if (dueDate) {
      const date = new Date(dueDate as string);
      filter.dueDate = { $lte: date };
    }

    if (isOverdue === "true") {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $nin: ["completed", "verified", "cancelled"] };
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const tasks = await Task.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const totalTasks = await Task.countDocuments(filter);
    const totalPages = Math.ceil(totalTasks / limitNum);

    res.status(200).json({
      tasks,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalTasks,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /tasks/:taskId - Get specific task
router.get("/:taskId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to the group
    if (!task.group?.id) {
      return res.status(400).json({ message: "Task has no associated group" });
    }
    const { hasAccess } = await checkGroupPermission(
      task.group.id.toString(),
      userId
    );
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ task });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /tasks - Create new task
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const validatedData = CreateTaskSchema.parse(req.body);

    // Check group access and get group info
    const { hasAccess, role, group } = await checkGroupPermission(
      validatedData.groupId,
      userId
    );
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this group" });
    }

    // Get creator info
    const creator = await User.findById(userId);
    if (!creator) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate event if provided
    let eventInfo = null;
    if (validatedData.eventId) {
      const event = await Event.findById(validatedData.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Ensure event belongs to the same group
      if (
        !event.group?.id ||
        event.group.id.toString() !== validatedData.groupId
      ) {
        return res
          .status(400)
          .json({ message: "Event does not belong to this group" });
      }

      eventInfo = {
        id: event._id,
        name: event.name,
        startDate: event.startDate,
      };
    }

    // Prepare assignees if provided
    const assignees = [];
    if (validatedData.assigneeIds && validatedData.assigneeIds.length > 0) {
      for (const assigneeId of validatedData.assigneeIds) {
        // Verify assignee is a group member
        const groupDoc = group as any;
        const isMember =
          groupDoc.members.some((m: any) => m.id.toString() === assigneeId) ||
          groupDoc.owner.toString() === assigneeId;

        if (!isMember) {
          return res.status(400).json({
            message: `User ${assigneeId} is not a member of this group`,
          });
        }

        const assigneeUser = await User.findById(assigneeId);
        if (!assigneeUser) {
          return res.status(404).json({
            message: `Assignee user ${assigneeId} not found`,
          });
        }

        assignees.push({
          id: assigneeUser._id,
          name: assigneeUser.name,
          email: assigneeUser.email,
          assignedAt: new Date(),
          assignedBy: {
            id: creator._id,
            name: creator.name,
          },
        });
      }
    }

    // Create task
    const task = new Task({
      title: validatedData.title,
      description: validatedData.description,
      creator: {
        id: creator._id,
        name: creator.name,
        email: creator.email,
      },
      group: {
        id: (group as any)._id,
        name: (group as any).name,
        type: (group as any).type,
      },
      event: eventInfo,
      assignees,
      priority: validatedData.priority,
      category: validatedData.category,
      dueDate: validatedData.dueDate
        ? new Date(validatedData.dueDate)
        : undefined,
      allowSelfAssign: validatedData.allowSelfAssign,
      requiresVerification: validatedData.requiresVerification,
    });

    await task.save();

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.issues,
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /tasks/:taskId - Update task
router.put("/:taskId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;
    const validatedData = UpdateTaskSchema.parse(req.body);

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check permissions
    if (!task.group?.id) {
      return res.status(400).json({ message: "Task has no associated group" });
    }
    const { hasAccess, role } = await checkGroupPermission(
      task.group.id.toString(),
      userId
    );
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if user can edit this task
    if (!(task as any).canUserEdit(userId, role)) {
      return res
        .status(403)
        .json({ message: "Insufficient permissions to edit this task" });
    }

    // Track status changes for comments
    let statusChange = null;
    if (validatedData.status && validatedData.status !== task.status) {
      statusChange = {
        from: task.status,
        to: validatedData.status,
      };
    }

    // Handle completion/verification tracking
    if (validatedData.status) {
      if (validatedData.status === "completed" && task.status !== "completed") {
        const user = await User.findById(userId);
        (task as any).completedAt = new Date();
        (task as any).completedBy = {
          id: userId,
          name: user?.name || "Unknown User",
        };
      } else if (
        validatedData.status === "verified" &&
        task.status !== "verified"
      ) {
        const user = await User.findById(userId);
        (task as any).verifiedAt = new Date();
        (task as any).verifiedBy = {
          id: userId,
          name: user?.name || "Unknown User",
        };
      }
    }

    // Update task fields
    Object.keys(validatedData).forEach((key) => {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        if (key === "dueDate" && validatedData.dueDate === null) {
          (task as any)[key] = undefined;
        } else if (key === "dueDate" && validatedData.dueDate) {
          (task as any)[key] = new Date(validatedData.dueDate);
        } else {
          (task as any)[key] = validatedData[key as keyof typeof validatedData];
        }
      }
    });

    // Add comment for status change
    if (statusChange) {
      const user = await User.findById(userId);
      const commentContent = `Status changed from ${statusChange.from} to ${statusChange.to}`;
      (task as any).addComment(
        userId,
        user?.name || "Unknown User",
        user?.email || "",
        commentContent,
        "status_change",
        statusChange
      );
    }

    await task.save();

    res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.issues,
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /tasks/:taskId - Delete task
router.delete(
  "/:taskId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.id;

      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check permissions - only creator or group owner/admin can delete
      if (!task.group?.id || !task.creator?.id) {
        return res.status(400).json({ message: "Task missing required data" });
      }
      const { hasAccess, role } = await checkGroupPermission(
        task.group.id.toString(),
        userId
      );
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (
        task.creator.id.toString() !== userId &&
        role !== "owner" &&
        role !== "admin"
      ) {
        return res
          .status(403)
          .json({
            message: "Only task creator or group admin can delete tasks",
          });
      }

      await Task.findByIdAndDelete(taskId);

      res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// POST /tasks/:taskId/assign - Assign users to task
router.post(
  "/:taskId/assign",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.id;
      const validatedData = AssignTaskSchema.parse(req.body);

      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check permissions
      if (!task.group?.id) {
        return res
          .status(400)
          .json({ message: "Task has no associated group" });
      }
      const { hasAccess, role } = await checkGroupPermission(
        task.group.id.toString(),
        userId
      );
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!(task as any).canUserAssign(userId, role)) {
        return res
          .status(403)
          .json({ message: "Insufficient permissions to assign this task" });
      }

      // Get assigner info
      const assigner = await User.findById(userId);
      if (!assigner) {
        return res.status(404).json({ message: "User not found" });
      }

      // Clear existing assignees
      (task as any).assignees = [];

      // Add new assignees
      const group = await Group.findById(task.group.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      for (const assigneeId of validatedData.assigneeIds) {
        // Verify assignee is a group member
        const isMember =
          (group as any).members.some(
            (m: any) => m.id.toString() === assigneeId
          ) || (group as any).owner.toString() === assigneeId;

        if (!isMember) {
          return res.status(400).json({
            message: `User ${assigneeId} is not a member of this group`,
          });
        }

        const assigneeUser = await User.findById(assigneeId);
        if (!assigneeUser) {
          return res.status(404).json({
            message: `Assignee user ${assigneeId} not found`,
          });
        }

        (task as any).assignees.push({
          id: assigneeUser._id,
          name: assigneeUser.name,
          email: assigneeUser.email,
          assignedAt: new Date(),
          assignedBy: {
            id: assigner._id,
            name: assigner.name,
          },
        });
      }

      // Add system comment
      const assigneeNames = (task as any).assignees
        .map((a: any) => a.name)
        .join(", ");
      (task as any).addComment(
        userId,
        assigner.name,
        assigner.email,
        `Task assigned to: ${assigneeNames}`,
        "assignment_change"
      );

      await task.save();

      res.status(200).json({
        message: "Task assigned successfully",
        task,
      });
    } catch (error) {
      console.error("Error assigning task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.issues,
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// POST /tasks/:taskId/claim - Self-assign task
router.post(
  "/:taskId/claim",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.id;

      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check group access
      if (!task.group?.id) {
        return res
          .status(400)
          .json({ message: "Task has no associated group" });
      }
      const { hasAccess } = await checkGroupPermission(
        task.group.id.toString(),
        userId
      );
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if task allows self-assignment
      if (!(task as any).allowSelfAssign) {
        return res
          .status(403)
          .json({ message: "Task does not allow self-assignment" });
      }

      // Check if already assigned
      if ((task as any).isUserAssigned(userId)) {
        return res
          .status(400)
          .json({ message: "You are already assigned to this task" });
      }

      // Get user info
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Add user to assignees
      (task as any).assignees.push({
        id: user._id,
        name: user.name,
        email: user.email,
        assignedAt: new Date(),
        assignedBy: {
          id: user._id,
          name: user.name,
        },
      });

      // Add system comment
      (task as any).addComment(
        userId,
        user.name,
        user.email,
        `${user.name} claimed this task`,
        "assignment_change"
      );

      await task.save();

      res.status(200).json({
        message: "Task claimed successfully",
        task,
      });
    } catch (error) {
      console.error("Error claiming task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// DELETE /tasks/:taskId/assign/:assigneeId - Remove assignee from task
router.delete(
  "/:taskId/assign/:assigneeId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { taskId, assigneeId } = req.params;
      const userId = req.user!.id;

      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check permissions
      if (!task.group?.id) {
        return res
          .status(400)
          .json({ message: "Task has no associated group" });
      }
      const { hasAccess, role } = await checkGroupPermission(
        task.group.id.toString(),
        userId
      );
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Can unassign if: user can assign tasks, or user is unassigning themselves
      if (!(task as any).canUserAssign(userId, role) && assigneeId !== userId) {
        return res
          .status(403)
          .json({ message: "Insufficient permissions to unassign this user" });
      }

      // Find and remove assignee
      const assigneeIndex = (task as any).assignees.findIndex(
        (a: any) => a.id.toString() === assigneeId
      );
      if (assigneeIndex === -1) {
        return res
          .status(404)
          .json({ message: "User is not assigned to this task" });
      }

      const removedAssignee = (task as any).assignees[assigneeIndex];
      (task as any).assignees.splice(assigneeIndex, 1);

      // Add system comment
      const user = await User.findById(userId);
      const action =
        assigneeId === userId
          ? "unassigned themselves"
          : `unassigned ${removedAssignee.name}`;
      (task as any).addComment(
        userId,
        user?.name || "Unknown User",
        user?.email || "",
        `${user?.name} ${action} from this task`,
        "assignment_change"
      );

      await task.save();

      res.status(200).json({
        message: "User unassigned successfully",
        task,
      });
    } catch (error) {
      console.error("Error unassigning user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// POST /tasks/:taskId/status - Update task status
router.post(
  "/:taskId/status",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.id;
      const validatedData = UpdateStatusSchema.parse(req.body);

      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check permissions
      if (!task.group?.id) {
        return res
          .status(400)
          .json({ message: "Task has no associated group" });
      }
      const { hasAccess, role } = await checkGroupPermission(
        task.group.id.toString(),
        userId
      );
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if user can edit task
      if (!(task as any).canUserEdit(userId, role)) {
        return res
          .status(403)
          .json({ message: "Insufficient permissions to update this task" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Handle status change
      const oldStatus = task.status;
      (task as any).status = validatedData.status;

      // Handle special status requirements
      if (validatedData.status === "blocked") {
        if (!validatedData.blockReason) {
          return res
            .status(400)
            .json({
              message: "Block reason is required when marking task as blocked",
            });
        }
        (task as any).isBlocked = true;
        (task as any).blockReason = validatedData.blockReason;
      } else {
        (task as any).isBlocked = false;
        (task as any).blockReason = undefined;
      }

      // Handle completion tracking
      if (validatedData.status === "completed" && oldStatus !== "completed") {
        (task as any).completedAt = new Date();
        (task as any).completedBy = {
          id: userId,
          name: user.name,
        };
      } else if (
        validatedData.status === "verified" &&
        oldStatus !== "verified"
      ) {
        (task as any).verifiedAt = new Date();
        (task as any).verifiedBy = {
          id: userId,
          name: user.name,
        };
      }

      // Add status change comment
      const statusChangeComment =
        validatedData.comment ||
        `Status changed from ${oldStatus} to ${validatedData.status}`;
      (task as any).addComment(
        userId,
        user.name,
        user.email,
        statusChangeComment,
        "status_change",
        { from: oldStatus, to: validatedData.status }
      );

      await task.save();

      res.status(200).json({
        message: "Task status updated successfully",
        task,
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.issues,
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// POST /tasks/:taskId/comments - Add comment to task
router.post(
  "/:taskId/comments",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.id;
      const validatedData = AddCommentSchema.parse(req.body);

      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check group access
      if (!task.group?.id) {
        return res
          .status(400)
          .json({ message: "Task has no associated group" });
      }
      const { hasAccess } = await checkGroupPermission(
        task.group.id.toString(),
        userId
      );
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Add comment
      const comment = (task as any).addComment(
        userId,
        user.name,
        user.email,
        validatedData.content,
        "comment"
      );

      await task.save();

      res.status(201).json({
        message: "Comment added successfully",
        comment,
        task,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.issues,
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// GET /tasks/group/:groupId - Get tasks for a specific group
router.get(
  "/group/:groupId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { groupId } = req.params;
      const userId = req.user!.id;
      const {
        status,
        priority,
        assignedToMe,
        page = "1",
        limit = "20",
      } = req.query;

      if (!groupId) {
        return res.status(400).json({ message: "Group ID is required" });
      }

      // Check group access
      const { hasAccess } = await checkGroupPermission(groupId, userId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this group" });
      }

      // Build filter
      const filter: any = { "group.id": groupId };
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (assignedToMe === "true") filter["assignees.id"] = userId;

      // Pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const tasks = await Task.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const totalTasks = await Task.countDocuments(filter);

      res.status(200).json({
        tasks,
        totalTasks,
        totalPages: Math.ceil(totalTasks / limitNum),
        currentPage: pageNum,
      });
    } catch (error) {
      console.error("Error fetching group tasks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// GET /tasks/event/:eventId - Get tasks for a specific event
router.get(
  "/event/:eventId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      const userId = req.user!.id;

      // First get the event to check group access
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check group access
      if (!event.group?.id) {
        return res
          .status(400)
          .json({ message: "Event has no associated group" });
      }
      const { hasAccess } = await checkGroupPermission(
        event.group.id.toString(),
        userId
      );
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const tasks = await Task.find({ "event.id": eventId }).sort({
        priority: -1,
        createdAt: -1,
      });

      res.status(200).json({ tasks });
    } catch (error) {
      console.error("Error fetching event tasks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
