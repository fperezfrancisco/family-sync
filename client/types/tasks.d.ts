/**
 * Task-related TypeScript type definitions
 */

export interface TaskComment {
  _id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  content: string;
  type: "comment" | "status_change" | "assignment_change" | "system";
  statusChange?: {
    from: TaskStatus;
    to: TaskStatus;
  };
  createdAt: string;
}

export interface TaskAssignee {
  _id: string;
  id: string;
  name: string;
  email: string;
  assignedAt: string;
  assignedBy: {
    id: string;
    name: string;
  };
}

export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "completed"
  | "verified"
  | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskCategory =
  | "supplies"
  | "logistics"
  | "preparation"
  | "chores"
  | "coordination"
  | "other";

export interface Task {
  _id: string;
  title: string;
  description?: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  group?: {
    id: string;
    name: string;
    type: "family" | "friends" | "work" | "other";
  };
  event?: {
    id: string;
    name: string;
    startDate: string;
  };
  assignees: TaskAssignee[];
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string;
  allowSelfAssign: boolean;
  requiresVerification: boolean;
  isBlocked: boolean;
  blockReason?: string;
  comments: TaskComment[];
  completedAt?: string;
  completedBy?: {
    id: string;
    name: string;
  };
  verifiedAt?: string;
  verifiedBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  isOverdue?: boolean;
  assigneeCount?: number;
  commentCount?: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  groupId?: string;
  eventId?: string;
  assigneeIds?: string[];
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string;
  allowSelfAssign: boolean;
  requiresVerification: boolean;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  dueDate?: string | null;
  allowSelfAssign?: boolean;
  requiresVerification?: boolean;
  status?: TaskStatus;
  blockReason?: string;
}

export interface AssignTaskData {
  assigneeIds: string[];
}

export interface UpdateTaskStatusData {
  status: TaskStatus;
  comment?: string;
  blockReason?: string;
}

export interface AddTaskCommentData {
  content: string;
}

export interface TaskFilters {
  groupId?: string;
  eventId?: string;
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  category?: TaskCategory | "all";
  assignedToMe?: boolean;
  createdByMe?: boolean;
  dueDate?: string;
  isOverdue?: boolean;
}

export interface TasksResponse {
  tasks: Task[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTasks: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface TaskResponse {
  task: Task;
  message?: string;
}

export interface TaskCommentResponse {
  comment: TaskComment;
  task: Task;
  message?: string;
}
