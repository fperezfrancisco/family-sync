"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Task } from "@/types/tasks";
import { useAuth } from "@/context/AuthContext";
import { TaskHeader, TaskTabs } from "@/components/tasks";
import { useTasks } from "@/context/TasksContext";
// import { TasksAPI } from "@/lib/api"; // TODO: Use when API is ready

/**
 * Individual Task Page
 * Displays detailed view of a specific task with tabs for different functionality
 * Access controlled by task permissions and user's role
 */
export default function TaskPage() {
  const params = useParams();
  const taskId = params.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { tasks } = useTasks();

  /**
   * Fetch task data from API
   * TODO: Replace with actual API call when backend is ready
   */
  const fetchTask = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Uncomment when API is ready
      // const taskData = await TasksAPI.getById(taskId);
      // setTask(taskData.task);

      // Temporary: find task from context
      const foundTask = tasks.find((t) => t._id === taskId);
      if (foundTask) {
        setTask(foundTask);
      } else {
        setError("Task not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task");
    } finally {
      setLoading(false);
    }
  }, [taskId, tasks]);

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId, fetchTask]);

  /**
   * Handle task updates (edit/delete)
   * Called from TaskHeader component
   */
  const handleTaskUpdate = () => {
    fetchTask(); // Refetch task data after updates
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-12 bg-muted rounded-lg"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  // Error state
  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {error || "Task Not Found"}
        </h2>
        <p className="text-muted-foreground mb-4">
          The task you&apos;re looking for doesn&apos;t exist or you don&apos;t
          have access to it.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Task Header with title, details, and action buttons */}
      <TaskHeader
        task={task}
        currentUserId={user?.id === null ? undefined : user?.id}
        onTaskUpdate={handleTaskUpdate}
      />

      {/* Tab Navigation and Content */}
      <TaskTabs taskId={taskId} task={task} />
    </div>
  );
}
