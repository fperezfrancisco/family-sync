"use client";

import React from "react";
import { Task } from "@/types/tasks";
import { CheckCircle, Calendar, Flag } from "lucide-react";
import { useRouter } from "next/navigation";

interface DashboardTaskCardProps {
  task: Task;
  isAssigned: boolean;
}

/**
 * DashboardTaskCard Component
 * Minimal task card for dashboard - shows title, priority, due date, and status
 * More minimal than the regular task card on the tasks page
 */
export default function DashboardTaskCard({
  task,
  isAssigned,
}: DashboardTaskCardProps) {
  const router = useRouter();

  const isCompleted = task.status === "completed" || task.status === "verified";

  // Format due date for display
  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `${diffDays}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get priority color
  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const dueDateInfo = formatDueDate(task.dueDate);
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

  return (
    <div
      onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        isCompleted
          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
          : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--primary)]"
      }`}
    >
      {/* Title */}
      <h4 className="font-medium text-[var(--foreground)] text-sm mb-2 truncate">
        {task.title}
      </h4>

      {/* Meta Info Row */}
      <div className="flex items-center gap-3 text-xs">
        {/* Priority */}
        {task.priority && (
          <div
            className={`flex items-center gap-1 ${getPriorityColor(
              task.priority
            )}`}
          >
            <Flag className="h-3 w-3" />
            <span className="capitalize">{task.priority}</span>
          </div>
        )}

        {/* Due Date */}
        {dueDateInfo && (
          <div
            className={`flex items-center gap-1 ${
              isOverdue ? "text-red-600" : "text-[var(--muted-foreground)]"
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>{dueDateInfo}</span>
          </div>
        )}

        {/* Status Badge for Completed */}
        {isCompleted && (
          <div className="ml-auto flex items-center gap-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span className="font-medium">
              {task.status === "verified" ? "Verified" : "Done"}
            </span>
          </div>
        )}
      </div>

      {/* Assignment Status */}
      {!isAssigned && (
        <div className="mt-2 text-xs text-[var(--muted-foreground)] italic">
          Open to claim
        </div>
      )}
    </div>
  );
}
