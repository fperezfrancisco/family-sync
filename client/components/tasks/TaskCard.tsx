"use client";

import React from "react";
import {
  Calendar,
  Clock,
  Users,
  User,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Flag,
  MessageSquare,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types/tasks";
import { useToast } from "@/context/ToastContext";

interface TaskCardProps {
  task: Task;
  onStatusUpdate?: (taskId: string, status: TaskStatus) => void;
  onViewDetails?: (taskId: string) => void;
  onClaim?: (taskId: string) => void;
  currentUserId?: string;
  showGroupInfo?: boolean;
}

/**
 * TaskCard Component
 * Displays individual task information in a card format
 */
export default function TaskCard({
  task,
  onStatusUpdate,
  onViewDetails,
  onClaim,
  currentUserId,
  showGroupInfo = true,
}: TaskCardProps) {
  const { showToast } = useToast();

  // Helper function to check if current user can update task
  const canUserUpdateTask = () => {
    if (!currentUserId) return false;

    // User can update if:
    // 1. Task is unassigned (can claim it)
    // 2. Task is assigned to current user
    return (
      !task.assignees ||
      task.assignees.length === 0 ||
      task.assignees.some((assignee) => assignee.id === currentUserId)
    );
  };

  const handleStatusUpdateClick = (newStatus: TaskStatus) => {
    if (!canUserUpdateTask()) {
      showToast(
        "You don't have permission to update this task. It's assigned to someone else.",
        "error"
      );
      return;
    }

    if (onStatusUpdate) {
      onStatusUpdate(task._id, newStatus);
    }
  };
  /**
   * Format due date for display
   */
  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isOverdue = diffTime < 0;
    const isToday = diffDays === 0;
    const isTomorrow = diffDays === 1;

    let displayText = "";
    if (isOverdue) {
      displayText = `Overdue by ${Math.abs(diffDays)} day${
        Math.abs(diffDays) !== 1 ? "s" : ""
      }`;
    } else if (isToday) {
      displayText = "Due today";
    } else if (isTomorrow) {
      displayText = "Due tomorrow";
    } else if (diffDays <= 7) {
      displayText = `Due in ${diffDays} day${diffDays !== 1 ? "s" : ""}`;
    } else {
      displayText = `Due ${date.toLocaleDateString()}`;
    }

    return {
      text: displayText,
      isOverdue,
      isUrgent: isToday || isTomorrow,
    };
  };

  /**
   * Get status display info
   */
  const getStatusInfo = (status: TaskStatus) => {
    switch (status) {
      case "not_started":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: "Not Started",
          color: "text-gray-500 bg-gray-100",
        };
      case "in_progress":
        return {
          icon: <Clock className="h-4 w-4" />,
          text: "In Progress",
          color: "text-blue-600 bg-blue-100",
        };
      case "blocked":
        return {
          icon: <Minus className="h-4 w-4" />,
          text: "Blocked",
          color: "text-red-600 bg-red-100",
        };
      case "completed":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: "Completed",
          color: "text-green-600 bg-green-100",
        };
      case "verified":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: "Verified",
          color: "text-emerald-600 bg-emerald-100",
        };
      case "cancelled":
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: "Cancelled",
          color: "text-gray-600 bg-gray-100",
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: status,
          color: "text-gray-500 bg-gray-100",
        };
    }
  };

  /**
   * Get priority display info
   */
  const getPriorityInfo = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          text: "Urgent",
          color: "text-red-600 dark:text-red-400",
        };
      case "high":
        return {
          icon: <Flag className="h-4 w-4" />,
          text: "High",
          color: "text-orange-600 dark:text-orange-400",
        };
      case "medium":
        return {
          icon: <Flag className="h-4 w-4" />,
          text: "Medium",
          color: "text-yellow-600 dark:text-yellow-400",
        };
      case "low":
        return {
          icon: <Flag className="h-4 w-4" />,
          text: "Low",
          color: "text-green-600",
        };
      default:
        return {
          icon: <Flag className="h-4 w-4" />,
          text: priority,
          color: "text-gray-600",
        };
    }
  };

  const statusInfo = getStatusInfo(task.status);
  const priorityInfo = getPriorityInfo(task.priority);
  const dueDateInfo = formatDueDate(task.dueDate);

  const canClaim = task.allowSelfAssign && task.assignees.length === 0;

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg font-semibold text-[var(--foreground)] cursor-pointer hover:text-[var(--accent)] truncate"
            onClick={() => onViewDetails?.(task._id)}
          >
            {task.title}
          </h3>
          {showGroupInfo && (
            <div className="flex items-center mt-1 text-sm text-[var(--secondary-foreground)]">
              <Users className="h-4 w-4 mr-1" />
              <span>{task.group.name}</span>
              {task.event && (
                <>
                  <span className="mx-2">•</span>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{task.event.name}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions Dropdown */}
        <div className="relative ml-4">
          <button className="text-[var(--secondary-foreground)] hover:text-[var(--foreground)] p-1">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-[var(--foreground)] text-sm mb-4 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Status and Priority Badges */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
        >
          {statusInfo.icon}
          {statusInfo.text}
        </div>

        <div
          className={`inline-flex items-center gap-1 text-xs ${priorityInfo.color}`}
        >
          {priorityInfo.icon}
          {priorityInfo.text}
        </div>

        {task.category !== "other" && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
            {task.category}
          </span>
        )}

        {task.isBlocked && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 dark:text-red-400 text-xs rounded-full">
            <Minus className="h-3 w-3" />
            Blocked
          </div>
        )}
      </div>

      {/* Due Date */}
      {dueDateInfo && (
        <div
          className={`flex items-center gap-1 text-xs mb-4 ${
            dueDateInfo.isOverdue
              ? "text-red-600 dark:text-red-400"
              : dueDateInfo.isUrgent
              ? "text-orange-600 dark:text-orange-400"
              : "text-gray-600"
          }`}
        >
          <Calendar className="h-3 w-3" />
          {dueDateInfo.text}
        </div>
      )}

      {/* Block Reason */}
      {task.isBlocked && task.blockReason && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-red-800">Blocked</p>
              <p className="text-xs text-red-700">{task.blockReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Assignees */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignees.length > 0 ? (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4 text-[var(--secondary-foreground)]" />
              <div className="flex -space-x-2">
                {task.assignees.slice(0, 3).map((assignee) => (
                  <div
                    key={assignee.id}
                    className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                    title={assignee.name}
                  >
                    {assignee.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {task.assignees.length > 3 && (
                  <div className="h-6 w-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
              <span className="text-xs text-[var(--secondary-foreground)] ml-1">
                {task.assignees.length === 1
                  ? task.assignees[0].name
                  : `${task.assignees.length} people`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[var(--secondary-foreground)]">
              <User className="h-4 w-4" />
              <span className="text-xs">Unassigned</span>
            </div>
          )}
        </div>

        {/* Comments Count */}
        {task.comments.length > 0 && (
          <div className="flex items-center gap-1 text-[var(--secondary-foreground)]">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">{task.comments.length}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {canClaim && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <button
            onClick={() => onClaim?.(task._id)}
            className="w-full px-3 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] rounded-md hover:bg-[var(--card)] transition-colors"
          >
            Claim Task
          </button>
        </div>
      )}

      {/* Quick Status Actions */}
      {task.assignees.length > 0 &&
        task.status !== "completed" &&
        task.status !== "verified" &&
        task.status !== "cancelled" && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              {task.status === "not_started" && (
                <button
                  onClick={() => handleStatusUpdateClick("in_progress")}
                  disabled={!canUserUpdateTask()}
                  className={`flex-1 px-3 py-2 text-xs font-medium border rounded-md transition-colors ${
                    canUserUpdateTask()
                      ? "text-[var(--foreground)] bg-[var(--background)] border-[var(--border)] hover:bg-[var(--card)]"
                      : "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                  }`}
                >
                  Start Task
                </button>
              )}
              {task.status === "in_progress" && (
                <button
                  onClick={() => handleStatusUpdateClick("completed")}
                  disabled={!canUserUpdateTask()}
                  className={`flex-1 px-3 py-2 text-xs font-medium border rounded-md transition-colors ${
                    canUserUpdateTask()
                      ? "text-[var(--foreground)] bg-[var(--background)] border-[var(--border)] hover:bg-[var(--card)]"
                      : "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                  }`}
                >
                  Mark Complete
                </button>
              )}
              {task.status === "blocked" && (
                <button
                  onClick={() => handleStatusUpdateClick("in_progress")}
                  disabled={!canUserUpdateTask()}
                  className={`flex-1 px-3 py-2 text-xs font-medium border rounded-md transition-colors ${
                    canUserUpdateTask()
                      ? "text-[var(--foreground)] bg-[var(--background)] border-[var(--border)] hover:bg-[var(--card)]"
                      : "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                  }`}
                >
                  Unblock
                </button>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
