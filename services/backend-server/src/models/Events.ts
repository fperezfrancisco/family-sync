import { Schema, model, type InferSchemaType } from "mongoose";
import { id } from "zod/locales";

/**
 * Event Attendee Schema
 * Represents an attendee's RSVP status for an event
 */
const EventAttendeeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "attending", "not_attending", "maybe"],
    default: "pending",
  },
  invitedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date, required: false },
});

/**
 * Event Schema
 * Represents an event that can be standalone or associated with a group
 */
const EventSchema = new Schema(
  {
    // Basic event information
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: 2000,
    },

    // Date and time information
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: false },
    isAllDay: { type: Boolean, default: false },
    timezone: { type: String, default: "UTC" },

    // Location information
    location: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
    locationUrl: {
      type: String,
      required: false,
      trim: true,
    },
    isVirtual: { type: Boolean, default: false },

    // Event ownership and group association
    owner: {
      id: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    group: {
      id: { type: Schema.Types.ObjectId, ref: "Group", required: false },
      name: { type: String, required: false },
      type: {
        type: String,
        enum: ["family", "friends", "work", "other"],
        default: "other",
      },
    },

    // Event settings
    isPrivate: { type: Boolean, default: false },
    allowGuestInvites: { type: Boolean, default: true },
    requireRSVP: { type: Boolean, default: true },
    maxAttendees: { type: Number, required: false },

    // Event host message and details
    creatorMessage: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
    rsvpDeadline: { type: Date, required: false },
    dressCode: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
    },

    // Attendees and invitations
    attendees: [EventAttendeeSchema],

    // Event status
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "published",
    },

    // Recurrence settings (for future implementation)
    isRecurring: { type: Boolean, default: false },
    recurrenceRule: { type: String, required: false }, // RRULE format
    parentEvent: { type: Schema.Types.ObjectId, ref: "Event", required: false },

    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Indexes for performance
EventSchema.index({ startDate: 1 });
EventSchema.index({ endDate: 1 });
EventSchema.index({ owner: 1 });
EventSchema.index({ "group.id": 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ "attendees.user": 1 });
EventSchema.index({ createdAt: -1 });

// Compound indexes
EventSchema.index({ owner: 1, startDate: 1 });
EventSchema.index({ "group.id": 1, startDate: 1 });
EventSchema.index({ owner: 1, status: 1 });

// Virtual for attendee count
EventSchema.virtual("attendeeCount").get(function () {
  return this.attendees?.filter((a) => a.status === "attending").length || 0;
});

// Virtual for pending invites count
EventSchema.virtual("pendingInvites").get(function () {
  return this.attendees?.filter((a) => a.status === "pending").length || 0;
});

// Method to check if user is attendee
EventSchema.methods.isUserAttendee = function (userId: string) {
  return this.attendees?.some((attendee: any) => {
    // Handle both populated and non-populated user references
    const attendeeUserId =
      typeof attendee.user === "object" ? attendee.user._id : attendee.user;
    return attendeeUserId.toString() === userId;
  });
};

// Method to get user's RSVP status
EventSchema.methods.getUserRSVPStatus = function (userId: string) {
  const attendee = this.attendees?.find((attendee: any) => {
    // Handle both populated and non-populated user references
    const attendeeUserId =
      typeof attendee.user === "object" ? attendee.user._id : attendee.user;
    return attendeeUserId.toString() === userId;
  });
  return attendee?.status || null;
};

// Pre-save middleware to update timestamps
EventSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Pre-save validation
EventSchema.pre("save", function (next) {
  // Validate end date is after start date
  if (this.endDate && this.endDate <= this.startDate) {
    next(new Error("End date must be after start date"));
  }

  // Validate max attendees
  if (this.maxAttendees && this.maxAttendees < 1) {
    next(new Error("Maximum attendees must be at least 1"));
  }

  next();
});

export type EventDoc = InferSchemaType<typeof EventSchema>;
export default model<EventDoc>("Event", EventSchema);
