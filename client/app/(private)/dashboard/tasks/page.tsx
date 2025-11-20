"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, RefreshCw } from "lucide-react";
import { Task, TaskFilters, TaskStatus, CreateTaskData } from "@/types/tasks";
import TaskGrid, { TaskGridSkeleton } from "@/components/tasks/TaskGrid";
import TaskFiltersComponent from "@/components/tasks/TaskFilters";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { useTasks } from "@/context/TasksContext";
import { useGroups } from "@/context/GroupsContext";
import { useEvents } from "@/context/EventsContext";
import { useAuth } from "@/context/AuthContext";

/**
 * Tasks Page Component
 * Main page for task management with filtering, creation, and grid display
 */
export default function TasksPage() {
  // Context hooks
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTaskStatus,
    assignTask,
    refreshTasks,
  } = useTasks();
  const { groups } = useGroups();
  const { events } = useEvents();
  const { user } = useAuth();

  // Local state for UI
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Refresh tasks manually
   */
  const handleRefreshTasks = async () => {
    setIsRefreshing(true);
    try {
      await refreshTasks();
    } catch (error) {
      console.error("Failed to refresh tasks:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Filter and search tasks
   */
  const applyFiltersAndSearch = useCallback(() => {
    let filtered = [...tasks];

    // Apply filters
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    if (filters.priority && filters.priority !== "all") {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }

    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter((task) => task.category === filters.category);
    }

    if (filters.groupId) {
      filtered = filtered.filter((task) => task.group.id === filters.groupId);
    }

    if (filters.assignedToMe && user) {
      filtered = filtered.filter((task) =>
        task.assignees.some((assignee) => assignee.id === user.id)
      );
    }

    if (filters.createdByMe && user) {
      filtered = filtered.filter((task) => task.creator.id === user.id);
    }

    if (filters.isOverdue) {
      filtered = filtered.filter((task) => task.isOverdue);
    }

    if (filters.dueDate) {
      const filterDate = new Date(filters.dueDate);
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        const taskDueDate = new Date(task.dueDate);
        return taskDueDate <= filterDate;
      });
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.creator.name.toLowerCase().includes(query) ||
          task.group.name.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, filters, searchQuery, user]);

  /**
   * Handle task status update
   */
  const handleTaskStatusUpdate = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, status);
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  /**
   * Handle task view details
   */
  const handleTaskViewDetails = (taskId: string) => {
    console.log(`Viewing task details for ${taskId}`);
    // TODO: Navigate to task detail page or open modal
  };

  /**
   * Handle task claim (self-assignment)
   */
  const handleTaskClaim = async (taskId: string) => {
    if (!user?.id) return;

    try {
      await assignTask(taskId, { assigneeIds: [user.id] });
    } catch (error) {
      console.error("Failed to claim task:", error);
    }
  };

  /**
   * Handle task creation
   */
  const handleCreateTask = async (taskData: CreateTaskData) => {
    try {
      await createTask(taskData);
    } catch (error) {
      console.error("Failed to create task:", error);
      throw error;
    }
  };

  // Apply filters and search when dependencies change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [applyFiltersAndSearch]);

  // Transform groups data for filters and modals
  const availableGroups = groups.map((group) => ({
    id: group.id,
    name: group.name,
    type: group.type,
  }));

  // Transform events data for modals
  const availableEvents = events.map((event) => ({
    id: event.id,
    name: event.name,
    startDate: event.startDate,
  }));

  // Get available users from groups for task assignment
  const availableUsers = groups
    .flatMap(
      (group) =>
        group.members?.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
        })) || []
    )
    .filter(
      (user, index, self) =>
        // Remove duplicates based on user ID
        index === self.findIndex((u) => u.id === user.id)
    );

  return (
    <div className="min-h-screen ">
      <div className="">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)] font-inter">
                Tasks
              </h1>
              <p className="text-[var(--foreground-muted)] mt-1">
                Manage and track tasks for your family and groups
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefreshTasks}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-3 py-2 text-[var(--foreground)]  border border-[var(--border)] rounded-md hover:bg-[var(--muted)] disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary)]/50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Task
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-md leading-5 placeholder-[var(--foreground)] focus:outline-none focus:placeholder-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            />
          </div>
        </div>

        {/* Filters */}
        <TaskFiltersComponent
          currentFilters={filters}
          onFilterChange={setFilters}
          availableGroups={availableGroups}
        />

        {/* Task Grid */}
        {tasksLoading ? (
          <TaskGridSkeleton />
        ) : (
          <TaskGrid
            tasks={filteredTasks}
            isLoading={tasksLoading}
            error={null}
            onCreateTask={() => setIsCreateModalOpen(true)}
            onTaskStatusUpdate={handleTaskStatusUpdate}
            onTaskViewDetails={handleTaskViewDetails}
            onTaskClaim={handleTaskClaim}
            currentUserId={user?.id || undefined}
          />
        )}

        {/* Create Task Modal */}
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateTask={handleCreateTask}
          availableGroups={availableGroups}
          availableEvents={availableEvents}
          availableUsers={availableUsers}
        />
      </div>
    </div>
  );
}
