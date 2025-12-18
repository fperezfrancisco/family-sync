"use client";

import React from "react";
import {
  Calendar,
  Users,
  User,
  CheckCircle,
  Flag,
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

  const priorityInfo = getPriorityInfo(task.priority);
  const dueDateInfo = formatDueDate(task.dueDate);

  const canClaim = task.allowSelfAssign && task.assignees.length === 0;
  const isCompleted = task.status === "completed" || task.status === "verified";

  return (
    <div
      className={`rounded-lg border p-6 hover:shadow-md hover:dark:shadow-neutral-700 transition-all ${
        isCompleted
          ? "bg-green-300/20 dark:bg-green-950/20 border-green-400 dark:border-green-800"
          : "bg-[var(--card)] border-[var(--border)]"
      }`}
    >
      {/* Header - Title */}
      <div className="flex items-start justify-between mb-3 w-full">
        <h3
          className="text-base font-semibold text-[var(--foreground)] cursor-pointer hover:text-[var(--primary)] flex-1 min-w-0"
          onClick={() => onViewDetails?.(task._id)}
        >
          {task.title}
        </h3>
      </div>

      {/* Group & Event Info */}
      {showGroupInfo && (
        <div className="flex flex-col gap-1 mb-3 text-xs text-[var(--secondary-foreground)]">
          {task.group && (
            <div className="flex items-center gap-1 truncate">
              <Users className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{task.group.name}</span>
            </div>
          )}
          {task.event && (
            <div className="flex items-center gap-1 truncate">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{task.event.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Priority & Due Date */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`inline-flex items-center gap-1 text-xs ${priorityInfo.color}`}
        >
          {priorityInfo.icon}
          <span>{priorityInfo.text}</span>
        </div>

        {dueDateInfo && (
          <div
            className={`flex items-center gap-1 text-xs ${
              dueDateInfo.isOverdue
                ? "text-red-600 dark:text-red-400"
                : dueDateInfo.isUrgent
                ? "text-orange-600 dark:text-orange-400"
                : "text-gray-600"
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>{dueDateInfo.text}</span>
          </div>
        )}

        {task.isBlocked && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full">
            <Minus className="h-3 w-3" />
            <span>Blocked</span>
          </div>
        )}
      </div>

      {/* Assignees */}
      <div className="mb-4">
        {task.assignees.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {task.assignees.slice(0, 3).map((assignee) => (
                <div
                  key={assignee.id}
                  className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-[var(--card)] dark:border-slate-800"
                  title={assignee.name}
                >
                  {assignee.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {task.assignees.length > 3 && (
                <div className="h-6 w-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-[var(--card)] dark:border-slate-800">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
            <span className="text-xs text-[var(--secondary-foreground)]">
              {task.assignees.length === 1
                ? task.assignees[0].name
                : `${task.assignees.length} assigned`}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-[var(--secondary-foreground)]">
            <User className="h-3 w-3" />
            <span>Unassigned</span>
          </div>
        )}
      </div>

      {/* Completion Badge */}
      {isCompleted && (
        <div className="mb-4 flex items-center justify-center gap-2 py-3 px-3 bg-green-600 text-white rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium text-sm">
            {task.status === "verified" ? "Verified" : "Completed"}
          </span>
        </div>
      )}

      {/* Claim Task Button */}
      {canClaim && (
        <div className="mb-4">
          <button
            onClick={() => onClaim?.(task._id)}
            className="w-full px-3 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors"
          >
            Claim Task
          </button>
        </div>
      )}

      {/* Quick Status Actions */}
      {!isCompleted && task.assignees.length > 0 && (
        <div className="flex gap-2">
          {task.status === "not_started" && (
            <button
              onClick={() => handleStatusUpdateClick("in_progress")}
              disabled={!canUserUpdateTask()}
              className={`flex-1 px-3 py-2 text-sm font-medium border rounded-md transition-colors ${
                canUserUpdateTask()
                  ? "text-[var(--foreground)] bg-[var(--background)] border-[var(--border)] hover:bg-[var(--primary)] hover:text-white"
                  : "text-neutral-400 bg-[var(--background)] dark:bg-[var(--muted)] border-[var(--muted)] cursor-not-allowed"
              }`}
            >
              Start
            </button>
          )}
          {task.status === "in_progress" && (
            <button
              onClick={() => handleStatusUpdateClick("completed")}
              disabled={!canUserUpdateTask()}
              className={`flex-1 px-3 py-2 text-xs font-medium border rounded-md transition-colors ${
                canUserUpdateTask()
                  ? "text-white bg-green-600 border-green-600 hover:bg-green-700"
                  : "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
              }`}
            >
              Complete
            </button>
          )}
          {task.status === "blocked" && (
            <button
              onClick={() => handleStatusUpdateClick("in_progress")}
              disabled={!canUserUpdateTask()}
              className={`flex-1 px-3 py-2 text-xs font-medium border rounded-md transition-colors ${
                canUserUpdateTask()
                  ? "text-white bg-purple-600 border-purple-600 hover:bg-purple-700"
                  : "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
              }`}
            >
              Unblock
            </button>
          )}
        </div>
      )}
    </div>
  );
}
