"use client";

import React from "react";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { Task, TaskStatus } from "@/types/tasks";
import TaskCard from "./TaskCard";

interface TaskGridProps {
  tasks: Task[];
  isLoading?: boolean;
  error?: string | null;
  onCreateTask?: () => void;
  onTaskStatusUpdate?: (taskId: string, status: TaskStatus) => void;
  onTaskViewDetails?: (taskId: string) => void;
  onTaskClaim?: (taskId: string) => void;
  currentUserId?: string;
  showGroupInfo?: boolean;
}

/**
 * TaskGrid Component
 * Displays a grid of task cards with loading and error states
 */
export default function TaskGrid({
  tasks,
  isLoading = false,
  error = null,
  onCreateTask,
  onTaskStatusUpdate,
  onTaskViewDetails,
  onTaskClaim,
  currentUserId,
  showGroupInfo = true,
}: TaskGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load tasks
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="bg-[var(--muted)] rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Plus className="h-8 w-8 text-[var(--muted-foreground)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            No tasks found
          </h3>
          <p className="text-[var(--foreground)] mb-6">
            Get started by creating your first task, or adjust your filters to
            see more results.
          </p>
          {onCreateTask && (
            <button
              onClick={onCreateTask}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary)]/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </button>
          )}
        </div>
      </div>
    );
  }

  // Task grid
  return (
    <div className="space-y-4">
      {/* Tasks header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--foreground)]">
          {tasks.length === 1 ? "1 task" : `${tasks.length} tasks`}
        </p>
        {onCreateTask && (
          <button
            onClick={onCreateTask}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        )}
      </div>

      {/* Task cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onStatusUpdate={
              onTaskStatusUpdate
                ? (taskId, status) => onTaskStatusUpdate(taskId, status)
                : undefined
            }
            onViewDetails={
              onTaskViewDetails ? () => onTaskViewDetails(task._id) : undefined
            }
            onClaim={onTaskClaim ? () => onTaskClaim(task._id) : undefined}
            currentUserId={currentUserId}
            showGroupInfo={showGroupInfo}
          />
        ))}
      </div>

      {/* Pagination placeholder - can be added later */}
      {tasks.length >= 20 && (
        <div className="flex justify-center pt-6">
          <p className="text-sm text-[var(--muted)]">
            Showing {tasks.length} tasks
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Task Grid Skeleton Loader
 * Shows loading placeholders while tasks are being fetched
 */
export function TaskGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Card skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
            </div>

            {/* Content */}
            <div className="space-y-3 mb-4">
              <div className="flex gap-2">
                <div className="h-5 w-12 bg-gray-200 rounded-full" />
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>

            {/* Assignees */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex -space-x-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-200 rounded" />
              <div className="h-8 w-8 bg-gray-200 rounded" />
              <div className="h-8 w-8 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
