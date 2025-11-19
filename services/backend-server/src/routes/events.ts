import { Router } from "express";
import { z } from "zod";
import Event, { type EventDoc } from "../models/Events.js";
import Group from "../models/Groups.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/requireAuth.js";
import type { Request, Response } from "express";

const router = Router();

// Extend Request type to include user from auth middleware
interface AuthRequest extends Request {
  user?: { id: string };
}

/**
 * Zod schemas for request validation
 */
const CreateEventSchema = z
  .object({
    name: z.string().min(1).max(200).trim(),
    description: z.string().max(2000).trim().optional(),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid start date format",
    }),
    endDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end date format",
      })
      .optional(),
    isAllDay: z.boolean().default(false),
    timezone: z.string().default("UTC"),
    location: z.string().max(500).trim().optional(),
    locationUrl: z.string().url().optional().or(z.literal("")),
    isVirtual: z.boolean().default(false),
    owner: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    }),
    group: z
      .object({
        id: z.string(),
        name: z.string().optional(),
        type: z.string().optional(),
      })
      .optional(),
    isPrivate: z.boolean().default(false),
    allowGuestInvites: z.boolean().default(true),
    requireRSVP: z.boolean().default(true),
    maxAttendees: z.number().min(1).optional(),
    inviteUserIds: z.array(z.string()).optional(), // Users to invite
  })
  .refine(
    (data) => {
      if (data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end > start;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

const UpdateEventSchema = z
  .object({
    name: z.string().min(1).max(200).trim().optional(),
    description: z.string().max(2000).trim().optional(),
    startDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start date format",
      })
      .optional(),
    endDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end date format",
      })
      .optional(),
    isAllDay: z.boolean().optional(),
    timezone: z.string().optional(),
    location: z.string().max(500).trim().optional(),
    locationUrl: z.string().url().optional().or(z.literal("")),
    isVirtual: z.boolean().optional(),
    isPrivate: z.boolean().optional(),
    allowGuestInvites: z.boolean().optional(),
    requireRSVP: z.boolean().optional(),
    maxAttendees: z.number().min(1).optional(),
    status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end > start;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

const RSVPSchema = z.object({
  status: z.enum(["attending", "not_attending", "maybe"]),
});

/**
 * Helper Functions
 */

/**
 * Check if user has permission to view an event
 */
async function canViewEvent(event: EventDoc, userId: string): Promise<boolean> {
  // Owner can always view
  if (event.owner?.id.toString() === userId) return true;

  // If event is public (not private), user can view
  if (!event.isPrivate) return true;

  // If event is associated with a group, check group membership
  if (event.group?.id) {
    const group = await Group.findById(event.group.id);
    if (group) {
      // Check if user is owner of the group
      if (group.owner.toString() === userId) return true;

      // Check if user is a member of the group
      const isMember = group.members.some(
        (member: any) => member.id.toString() === userId
      );
      if (isMember) return true;
    }
  }

  // Check if user is invited as attendee
  const isInvited = event.attendees?.some(
    (attendee: any) => attendee.user.toString() === userId
  );

  return isInvited || false;
}

/**
 * Check if user can edit an event
 */
function canEditEvent(event: EventDoc, userId: string): boolean {
  return event.owner?.id.toString() === userId;
}

/**
 * Check if user can delete an event
 */
function canDeleteEvent(event: EventDoc, userId: string): boolean {
  return event.owner?.id.toString() === userId;
}

/**
 * Get user's role in a group (for group events)
 */
async function getUserRoleInGroup(
  groupId: string,
  userId: string
): Promise<string | null> {
  const group = await Group.findById(groupId);
  if (!group) return null;

  // Check if user is owner
  if (group.owner.toString() === userId) return "owner";

  // Check if user is a member
  const member = group.members.find((m: any) => m.id.toString() === userId);
  return member ? (member as any).role : null;
}

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * GET /events
 * Get all events for the authenticated user
 * Includes standalone events and events from groups user belongs to
 */
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get query parameters for filtering
    const {
      startDate,
      endDate,
      groupId,
      status = "published",
      limit = "50",
      offset = "0",
    } = req.query;

    // Build query
    const query: any = {
      $or: [
        // Events owned by user
        { owner: userId },
        // Events user is invited to
        { "attendees.user": userId },
        // Events from groups user belongs to (public events only)
        { "group.id": { $in: await getUserGroups(userId) }, isPrivate: false },
      ],
    };

    // Add status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Add date range filter
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) {
        query.startDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.startDate.$lte = new Date(endDate as string);
      }
    }

    // Add group filter
    if (groupId) {
      query["group.id"] = groupId;
    }

    const events = await Event.find(query)
      .populate("owner", "name email")
      .populate("group", "_id name type")
      .populate("attendees.user", "name email")
      .sort({ startDate: 1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    return res.status(200).json({
      message: "Events retrieved successfully",
      events: events.map((event) => ({
        id: event._id,
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        isAllDay: event.isAllDay,
        location: event.location,
        isVirtual: event.isVirtual,
        owner: event.owner,
        group: event.group
          ? {
              id: event.group.id,
              name: event.group.name,
              type: event.group.type,
            }
          : undefined,
        isPrivate: event.isPrivate,
        status: event.status,
        attendeeCount: (event as any).attendeeCount,
        userRSVPStatus: (event as any).getUserRSVPStatus(userId),
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      })),
      total: events.length,
      hasMore: events.length === parseInt(limit as string),
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Helper function to get groups user belongs to
 */
async function getUserGroups(userId: string) {
  const groups = await Group.find({
    $or: [{ owner: userId }, { "members.id": userId }],
  }).select("_id");

  return groups.map((group) => group._id);
}

/**
 * GET /events/:eventId
 * Get specific event details
 */
router.get("/:eventId", async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const event = await Event.findById(eventId)
      .populate("owner", "name email")
      .populate("group", "_id name type")
      .populate("attendees.user", "name email");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user has permission to view this event
    const canView = await canViewEvent(event, userId);
    if (!canView) {
      return res.status(403).json({
        message: "Access denied: You don't have permission to view this event",
      });
    }

    return res.status(200).json({
      message: "Event retrieved successfully",
      event: {
        id: event._id,
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        isAllDay: event.isAllDay,
        timezone: event.timezone,
        location: event.location,
        locationUrl: event.locationUrl,
        isVirtual: event.isVirtual,
        owner: event.owner,
        group: event.group
          ? {
              id: event.group.id,
              name: event.group.name,
              type: event.group.type,
            }
          : undefined,
        isPrivate: event.isPrivate,
        allowGuestInvites: event.allowGuestInvites,
        requireRSVP: event.requireRSVP,
        maxAttendees: event.maxAttendees,
        attendees: event.attendees,
        status: event.status,
        attendeeCount: (event as any).attendeeCount,
        pendingInvites: (event as any).pendingInvites,
        userRSVPStatus: (event as any).getUserRSVPStatus(userId),
        canEdit: canEditEvent(event, userId),
        canDelete: canDeleteEvent(event, userId),
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /events
 * Create a new event
 */
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const eventData = CreateEventSchema.parse(req.body);

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If event is associated with a group, verify user has permission
    if (eventData.group) {
      const userRole = await getUserRoleInGroup(eventData.group.id, userId);
      if (!userRole) {
        return res.status(403).json({
          message: "Access denied: You are not a member of this group",
        });
      }

      // Only owners, admins, and members can create events in a group
      if (!["owner", "admin", "member"].includes(userRole)) {
        return res.status(403).json({
          message:
            "Access denied: Insufficient permissions to create events in this group",
        });
      }
    }

    // Create event
    const event = new Event({
      name: eventData.name,
      description: eventData.description,
      startDate: new Date(eventData.startDate),
      endDate: eventData.endDate ? new Date(eventData.endDate) : undefined,
      isAllDay: eventData.isAllDay,
      timezone: eventData.timezone,
      location: eventData.location,
      locationUrl: eventData.locationUrl,
      isVirtual: eventData.isVirtual,
      owner: eventData.owner,
      group: eventData.group || undefined,
      isPrivate: eventData.isPrivate,
      allowGuestInvites: eventData.allowGuestInvites,
      requireRSVP: eventData.requireRSVP,
      maxAttendees: eventData.maxAttendees,
      attendees: [],
    });

    // Add creator as first attendee (attending)
    (event.attendees as any).push({
      user: userId,
      status: "attending",
      invitedAt: new Date(),
      respondedAt: new Date(),
    });

    // Add invited users if provided
    if (eventData.inviteUserIds && eventData.inviteUserIds.length > 0) {
      for (const inviteUserId of eventData.inviteUserIds) {
        // Verify invited user exists
        const invitedUser = await User.findById(inviteUserId);
        if (invitedUser) {
          (event.attendees as any).push({
            user: inviteUserId,
            status: "pending",
            invitedAt: new Date(),
          });
        }
      }
    }

    await event.save();
    //await event.populate("owner", "name email");
    //await event.populate("group", "_id name type");
    await event.populate("attendees.user", "name email");

    return res.status(201).json({
      message: "Event created successfully",
      event: {
        id: String(event.toObject()._id),
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        isAllDay: event.isAllDay,
        timezone: event.timezone,
        location: event.location,
        locationUrl: event.locationUrl,
        isVirtual: event.isVirtual,
        owner: event.owner,
        group: event.group
          ? {
              id: event.group.id,
              name: event.group.name,
              type: event.group.type,
            }
          : undefined,
        isPrivate: event.isPrivate,
        allowGuestInvites: event.allowGuestInvites,
        requireRSVP: event.requireRSVP,
        maxAttendees: event.maxAttendees,
        attendees: event.attendees,
        status: event.status,
        attendeeCount: (event as any).attendeeCount,
        pendingInvites: (event as any).pendingInvites,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.issues,
      });
    }
    console.error("Error creating event:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PUT /events/:eventId
 * Update an event (owner only)
 */
router.put("/:eventId", async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updateData = UpdateEventSchema.parse(req.body);

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user has permission to edit this event
    if (!canEditEvent(event, userId)) {
      return res.status(403).json({
        message: "Access denied: Only event owner can update the event",
      });
    }

    // Update event fields
    Object.assign(event, updateData);

    // Convert date strings to Date objects if provided
    if (updateData.startDate) {
      event.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      event.endDate = new Date(updateData.endDate);
    }

    await event.save();
    await event.populate("owner", "name email");
    await event.populate("group", "_id name type");
    await event.populate("attendees.user", "name email");

    return res.status(200).json({
      message: "Event updated successfully",
      event: {
        id: event._id,
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        isAllDay: event.isAllDay,
        timezone: event.timezone,
        location: event.location,
        locationUrl: event.locationUrl,
        isVirtual: event.isVirtual,
        owner: event.owner,
        group: event.group
          ? {
              id: event.group.id,
              name: event.group.name,
              type: event.group.type,
            }
          : undefined,
        isPrivate: event.isPrivate,
        allowGuestInvites: event.allowGuestInvites,
        requireRSVP: event.requireRSVP,
        maxAttendees: event.maxAttendees,
        attendees: event.attendees,
        status: event.status,
        attendeeCount: (event as any).attendeeCount,
        pendingInvites: (event as any).pendingInvites,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.issues,
      });
    }
    console.error("Error updating event:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * DELETE /events/:eventId
 * Delete an event (owner only)
 */
router.delete("/:eventId", async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user has permission to delete this event
    if (!canDeleteEvent(event, userId)) {
      return res.status(403).json({
        message: "Access denied: Only event owner can delete the event",
      });
    }

    await Event.findByIdAndDelete(eventId);

    return res.status(200).json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /events/:eventId/rsvp
 * RSVP to an event
 */
router.post("/:eventId/rsvp", async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { status } = RSVPSchema.parse(req.body);

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user has permission to RSVP (must be invited or event must be public)
    const canRSVP = await canViewEvent(event, userId);
    if (!canRSVP) {
      return res.status(403).json({
        message: "Access denied: You are not invited to this event",
      });
    }

    // Check if RSVP is required
    if (!event.requireRSVP) {
      return res.status(400).json({
        message: "RSVP is not required for this event",
      });
    }

    // Find existing attendee record or create new one
    let attendeeIndex = (event.attendees as any).findIndex(
      (attendee: any) => attendee.user.toString() === userId
    );

    if (attendeeIndex !== -1) {
      // Update existing RSVP
      (event.attendees as any)[attendeeIndex].status = status;
      (event.attendees as any)[attendeeIndex].respondedAt = new Date();
    } else {
      // Create new attendee record (for public events where user wasn't originally invited)
      (event.attendees as any).push({
        user: userId,
        status: status,
        invitedAt: new Date(),
        respondedAt: new Date(),
      });
    }

    // Check max attendees limit for "attending" status
    if (status === "attending" && event.maxAttendees) {
      const attendingCount = (event.attendees as any).filter(
        (a: any) => a.status === "attending"
      ).length;

      if (attendingCount > event.maxAttendees) {
        return res.status(400).json({
          message: "Event has reached maximum attendee limit",
        });
      }
    }

    await event.save();

    return res.status(200).json({
      message: `RSVP updated to ${status}`,
      rsvpStatus: status,
      attendeeCount: (event as any).attendeeCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.issues,
      });
    }
    console.error("Error updating RSVP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /events/:eventId/invite
 * Invite users to an event (owner only)
 */
router.post("/:eventId/invite", async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;
    const { userIds } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "User IDs are required" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user has permission to invite others
    if (!canEditEvent(event, userId)) {
      return res.status(403).json({
        message: "Access denied: Only event owner can invite users",
      });
    }

    const newInvites = [];

    for (const inviteUserId of userIds) {
      // Check if user exists
      const invitedUser = await User.findById(inviteUserId);
      if (!invitedUser) {
        continue; // Skip non-existent users
      }

      // Check if user is already invited
      const existingAttendee = (event.attendees as any).find(
        (attendee: any) => attendee.user.toString() === inviteUserId
      );

      if (!existingAttendee) {
        (event.attendees as any).push({
          user: inviteUserId,
          status: "pending",
          invitedAt: new Date(),
        });

        newInvites.push({
          user: invitedUser,
          status: "pending",
        });
      }
    }

    await event.save();

    return res.status(200).json({
      message: `${newInvites.length} user(s) invited successfully`,
      newInvites: newInvites,
      totalInvites: (event.attendees as any).length,
    });
  } catch (error) {
    console.error("Error inviting users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /events/group/:groupId
 * Get all events for a specific group
 */
router.get("/group/:groupId", async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!groupId) {
      return res.status(400).json({ message: "Group ID is required" });
    }
    // Verify user has access to the group
    const userRole = await getUserRoleInGroup(groupId, userId);
    if (!userRole) {
      return res.status(403).json({
        message: "Access denied: You are not a member of this group",
      });
    }

    const events = await Event.find({
      "group.id": groupId,
      status: { $in: ["published", "draft"] },
    })
      .populate("owner", "name email")
      .populate("group", "_id name type")
      .populate("attendees.user", "name email")
      .sort({ startDate: 1 });

    return res.status(200).json({
      message: "Group events retrieved successfully",
      events: events.map((event) => ({
        id: event._id,
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        isAllDay: event.isAllDay,
        location: event.location,
        isVirtual: event.isVirtual,
        owner: event.owner,
        group: event.group
          ? {
              id: event.group.id,
              name: event.group.name,
              type: event.group.type,
            }
          : undefined,
        isPrivate: event.isPrivate,
        status: event.status,
        attendeeCount: (event as any).attendeeCount,
        userRSVPStatus: (event as any).getUserRSVPStatus(userId),
        canEdit: canEditEvent(event, userId),
        canDelete: canDeleteEvent(event, userId),
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching group events:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
