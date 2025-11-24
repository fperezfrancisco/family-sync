import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Task Comment Schema
 * Represents comments, status updates, and activity history for a task
 */
const TaskCommentSchema = new Schema(
  {
    user: {
      id: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ["comment", "status_change", "assignment_change", "system"],
      default: "comment",
    },
    // For status change comments, track what changed
    statusChange: {
      from: {
        type: String,
        enum: [
          "not_started",
          "in_progress",
          "blocked",
          "completed",
          "verified",
          "cancelled",
        ],
        required: false,
      },
      to: {
        type: String,
        enum: [
          "not_started",
          "in_progress",
          "blocked",
          "completed",
          "verified",
          "cancelled",
        ],
        required: false,
      },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/**
 * Task Assignee Schema
 * Represents users assigned to a task
 */
const TaskAssigneeSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: {
      id: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
    },
  },
  { _id: true }
);

/**
 * Task Schema
 * Represents a task within a group, optionally associated with an event
 */
const TaskSchema = new Schema(
  {
    // Basic task information
    title: {
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

    // Task ownership and group association
    creator: {
      id: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    group: {
      id: { type: Schema.Types.ObjectId, ref: "Group", required: true },
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ["family", "friends", "work", "other"],
        required: true,
      },
    },

    // Optional event association
    event: {
      type: {
        id: { type: Schema.Types.ObjectId, ref: "Event", required: true },
        name: { type: String, required: true },
        startDate: { type: Date, required: true },
      },
      required: false,
      default: undefined,
    },

    // Task assignment and status
    assignees: {
      type: [TaskAssigneeSchema],
      default: [],
    },
    status: {
      type: String,
      enum: [
        "not_started",
        "in_progress",
        "blocked",
        "completed",
        "verified",
        "cancelled",
      ],
      default: "not_started",
    },

    // Task properties
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    category: {
      type: String,
      enum: [
        "supplies",
        "logistics",
        "preparation",
        "chores",
        "coordination",
        "other",
      ],
      default: "other",
    },
    dueDate: { type: Date, required: false, default: undefined },

    // Task settings
    allowSelfAssign: { type: Boolean, default: true },
    requiresVerification: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    blockReason: {
      type: String,
      required: false,
      maxlength: 500,
      default: undefined,
    },

    // Comments and updates
    comments: {
      type: [TaskCommentSchema],
      default: [],
    },

    // Completion tracking
    completedAt: { type: Date, required: false, default: undefined },
    completedBy: {
      type: {
        id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
      },
      required: false,
      default: undefined,
    },
    verifiedAt: { type: Date, required: false, default: undefined },
    verifiedBy: {
      type: {
        id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
      },
      required: false,
      default: undefined,
    },

    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Indexes for performance
TaskSchema.index({ "group.id": 1 });
TaskSchema.index({ "creator.id": 1 });
TaskSchema.index({ "assignees.id": 1 });
TaskSchema.index({ "event.id": 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ category: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ createdAt: -1 });

// Compound indexes for common queries
TaskSchema.index({ "group.id": 1, status: 1 });
TaskSchema.index({ "group.id": 1, dueDate: 1 });
TaskSchema.index({ "group.id": 1, priority: 1 });
TaskSchema.index({ "assignees.id": 1, status: 1 });
TaskSchema.index({ "event.id": 1, status: 1 });

// Virtual for checking if task is overdue
TaskSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate) return false;
  return (
    new Date() > this.dueDate &&
    this.status !== "completed" &&
    this.status !== "verified" &&
    this.status !== "cancelled"
  );
});

// Virtual for assigned user count
TaskSchema.virtual("assigneeCount").get(function () {
  return this.assignees?.length || 0;
});

// Virtual for comment count
TaskSchema.virtual("commentCount").get(function () {
  return (
    this.comments?.filter((comment) => comment.type === "comment").length || 0
  );
});

// Method to check if user is assigned to task
TaskSchema.methods.isUserAssigned = function (userId: string) {
  return this.assignees?.some(
    (assignee: any) => assignee.id.toString() === userId
  );
};

// Method to check if user can edit task
TaskSchema.methods.canUserEdit = function (userId: string, userRole?: string) {
  // Creator can always edit
  if (this.creator.id.toString() === userId) return true;

  // Group owners and admins can edit
  if (userRole === "owner" || userRole === "admin") return true;

  // Assignees can edit certain fields
  if (this.isUserAssigned(userId)) return true;

  return false;
};

// Method to check if user can assign/reassign task
TaskSchema.methods.canUserAssign = function (
  userId: string,
  userRole?: string
) {
  // Creator can always assign
  if (this.creator.id.toString() === userId) return true;

  // Group owners and admins can assign
  if (userRole === "owner" || userRole === "admin") return true;

  return false;
};

// Method to add comment with automatic status change detection
TaskSchema.methods.addComment = function (
  userId: string,
  userName: string,
  userEmail: string,
  content: string,
  type = "comment",
  statusChange?: { from: string; to: string }
) {
  const comment = {
    user: { id: userId, name: userName, email: userEmail },
    content,
    type,
    statusChange,
    createdAt: new Date(),
  };

  this.comments.push(comment);
  this.updatedAt = new Date();

  return comment;
};

// Pre-save middleware to update timestamps and handle status changes
TaskSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }

  // Auto-set completion time when status changes to completed
  if (this.isModified("status")) {
    if (this.status === "completed" && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status === "verified" && !this.verifiedAt) {
      this.verifiedAt = new Date();
    } else if (this.status !== "completed" && this.status !== "verified") {
      // Reset completion times if status changed away from completed/verified
      this.completedAt = null;
      this.verifiedAt = null;
      this.completedBy = null;
      this.verifiedBy = null;
    }
  }

  // Clear block reason when task is no longer blocked
  if (this.isModified("status") && this.status !== "blocked") {
    this.isBlocked = false;
    this.blockReason = null;
  }

  next();
});

// Pre-save validation
TaskSchema.pre("save", function (next) {
  // Validate block reason is provided when blocked
  if (this.status === "blocked" && !this.blockReason) {
    return next(new Error("Block reason is required when task is blocked"));
  }

  // Ensure blocked flag matches status
  if (this.status === "blocked") {
    this.isBlocked = true;
  }

  next();
});

export type TaskDoc = InferSchemaType<typeof TaskSchema>;
export type TaskCommentDoc = InferSchemaType<typeof TaskCommentSchema>;
export type TaskAssigneeDoc = InferSchemaType<typeof TaskAssigneeSchema>;

export default model<TaskDoc>("Task", TaskSchema);
