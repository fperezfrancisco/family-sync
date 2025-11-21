"use client";

import React, { useState } from "react";
import {
  Trash2,
  Edit3,
  ArrowLeft,
  Calendar,
  Users,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Minus,
  Flag,
  Play,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Task, TaskStatus, UpdateTaskData } from "@/types/tasks";
import Modal from "@/components/ui/Modal";
import { useTasks } from "@/context/TasksContext";
import { useToast } from "@/context/ToastContext";
import EditTaskModal from "./EditTaskModal";

interface TaskHeaderProps {
  task: Task;
  currentUserId?: string;
  onTaskUpdate?: () => void;
}

/**
 * Utility function to check if user can edit task
 * Task creator or assignees can edit
 */
const canEditTask = (task: Task, userId?: string): boolean => {
  if (!userId) return false;
  return (
    task.creator.id === userId ||
    task.assignees.some((assignee) => assignee.id === userId)
  );
};

/**
 * Utility function to check if user can delete task
 * Only task creator can delete
 */
const canDeleteTask = (task: Task, userId?: string): boolean => {
  if (!userId) return false;
  return task.creator.id === userId;
};

/**
 * Utility function to check if user can update task status
 * Assignees can update status, anyone can claim unassigned tasks
 */
const canUpdateTaskStatus = (task: Task, userId?: string): boolean => {
  if (!userId) return false;
  return (
    task.assignees.length === 0 || // Unassigned tasks can be claimed
    task.assignees.some((assignee) => assignee.id === userId)
  );
};

/**
 * Task Header Component
 * Displays task information and action buttons based on user permissions
 */
export default function TaskHeader({
  task,
  currentUserId,
  onTaskUpdate,
}: TaskHeaderProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { deleteTask, updateTask, updateTaskStatus, assignTask } = useTasks();

  const canEdit = canEditTask(task, currentUserId);
  const canDelete = canDeleteTask(task, currentUserId);
  const canUpdateStatus = canUpdateTaskStatus(task, currentUserId);

  // Get task status styling and icon
  const getStatusDisplay = (status: TaskStatus) => {
    switch (status) {
      case "not_started":
        return {
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
          icon: Minus,
          label: "Not Started",
        };
      case "in_progress":
        return {
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
          icon: Play,
          label: "In Progress",
        };
      case "blocked":
        return {
          color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
          icon: AlertTriangle,
          label: "Blocked",
        };
      case "completed":
        return {
          color:
            "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
          icon: CheckCircle,
          label: "Completed",
        };
      case "verified":
        return {
          color:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
          icon: CheckCircle,
          label: "Verified",
        };
      case "cancelled":
        return {
          color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
          icon: XCircle,
          label: "Cancelled",
        };
      default:
        return {
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
          icon: Minus,
          label: status,
        };
    }
  };

  // Get priority styling
  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Get category styling
  const getCategoryColor = (category: Task["category"]) => {
    switch (category) {
      case "supplies":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "logistics":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "preparation":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "chores":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "coordination":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400";
      case "other":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Handle edit task
  const handleEditTask = () => {
    setIsEditModalOpen(true);
  };

  // Handle task update (placeholder for API integration)
  const handleTaskUpdate = async (
    taskId: string,
    updateData: UpdateTaskData
  ) => {
    try {
      setIsLoading(true);
      await updateTask(taskId, updateData);
      showToast("Task updated successfully", "success");
      onTaskUpdate?.();
    } catch (error) {
      console.error("Error updating task:", error);
      showToast("Failed to update task. Please try again.", "error");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete task
  const handleDeleteTask = async () => {
    try {
      setIsLoading(true);
      await deleteTask(task._id);
      showToast("Task deleted successfully", "success");
      router.push("/dashboard/tasks");
    } catch (error) {
      console.error("Failed to delete task:", error);
      showToast("Failed to delete task. Please try again.", "error");
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: TaskStatus) => {
    if (!canUpdateStatus) {
      showToast(
        "You don't have permission to update this task status",
        "error"
      );
      return;
    }

    try {
      await updateTaskStatus(task._id, newStatus);
      showToast(`Task marked as ${newStatus.replace("_", " ")}`, "success");
      onTaskUpdate?.();
    } catch (error) {
      console.error("Failed to update task status:", error);
      showToast("Failed to update task status. Please try again.", "error");
    }
  };

  // Handle claim task
  const handleClaimTask = async () => {
    if (!currentUserId) return;

    try {
      await assignTask(task._id, { assigneeIds: [currentUserId] });
      showToast("Task claimed successfully", "success");
      onTaskUpdate?.();
    } catch (error) {
      console.error("Failed to claim task:", error);
      showToast("Failed to claim task. Please try again.", "error");
    }
  };

  const statusDisplay = getStatusDisplay(task.status);
  const StatusIcon = statusDisplay.icon;

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        {/* Navigation and Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Status Actions */}
            {canUpdateStatus && (
              <div className="flex items-center gap-2 mr-3">
                {task.status === "not_started" && (
                  <button
                    onClick={() => handleStatusUpdate("in_progress")}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Task
                  </button>
                )}
                {task.status === "in_progress" && (
                  <button
                    onClick={() => handleStatusUpdate("completed")}
                    className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </button>
                )}
                {task.status === "blocked" && (
                  <button
                    onClick={() => handleStatusUpdate("in_progress")}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Unblock
                  </button>
                )}
              </div>
            )}

            {/* Claim Task Button */}
            {task.assignees.length === 0 &&
              task.allowSelfAssign &&
              currentUserId && (
                <button
                  onClick={handleClaimTask}
                  className="flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-colors"
                >
                  <User className="h-4 w-4 mr-2" />
                  Claim Task
                </button>
              )}

            {/* Edit/Delete Actions */}
            {(canEdit || canDelete) && (
              <div className="flex items-center gap-2 border-l border-border pl-3 ml-3">
                {canEdit && (
                  <button
                    onClick={handleEditTask}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Task
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Task Information */}
        <div className="space-y-4">
          {/* Title and Status */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground font-inter">
                  {task.title}
                </h1>
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${statusDisplay.color}`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusDisplay.label}
                </span>
              </div>

              {/* Priority and Category Badges */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  <Flag className="h-3 w-3 inline mr-1" />
                  {task.priority} Priority
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getCategoryColor(
                    task.category
                  )}`}
                >
                  {task.category}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-muted-foreground text-lg leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            {/* Due Date */}
            {task.dueDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Due Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(task.dueDate)}
                  </p>
                  {task.isOverdue && (
                    <span className="text-xs text-red-600 font-medium">
                      Overdue
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Creator */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Created By</p>
                <p className="text-sm text-muted-foreground">
                  {task.creator.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {task.creator.email}
                </p>
              </div>
            </div>

            {/* Group Association */}
            {task.group && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Group</p>
                  <p className="text-sm text-muted-foreground">
                    {task.group.name}
                  </p>
                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded capitalize">
                    {task.group.type}
                  </span>
                </div>
              </div>
            )}

            {/* Event Association */}
            {task.event && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Event</p>
                  <p className="text-sm text-muted-foreground">
                    {task.event.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(task.event.startDate)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Assignees */}
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">
                Assigned to:
              </span>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {task.assignees.slice(0, 5).map((assignee) => (
                    <div
                      key={assignee._id}
                      className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-medium"
                      title={`${assignee.name} - Assigned ${new Date(
                        assignee.assignedAt
                      ).toLocaleDateString()}`}
                    >
                      {assignee.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  ))}
                  {task.assignees.length > 5 && (
                    <div className="w-8 h-8 bg-muted border-2 border-background rounded-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                      +{task.assignees.length - 5}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({task.assignees.length} assigned)
                </span>
              </div>
            </div>
          )}

          {/* Task Settings */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                Created {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
            {task.requiresVerification && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Requires verification</span>
              </div>
            )}
            {task.allowSelfAssign && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Self-assignment allowed</span>
              </div>
            )}
            {task.isBlocked && task.blockReason && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-red-600">
                  Blocked: {task.blockReason}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isLoading && setIsDeleteModalOpen(false)}
        title="Delete Task"
        size="md"
      >
        <div className="space-y-4 p-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete &quot;{task.title}&quot;? This
            action cannot be undone. All task data, comments, and associated
            information will be permanently lost.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isLoading}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteTask}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Deleting..." : "Delete Task"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Task Modal */}
      <EditTaskModal
        key={`edit-${task._id}-${isEditModalOpen}`}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleTaskUpdate}
        isLoading={isLoading}
        task={task}
      />
    </>
  );
}
