"use client";

import React, { createContext, useEffect, useState } from "react";
import { TasksAPI } from "@/lib/api";
import { useAuth } from "./AuthContext";
import {
  Task,
  CreateTaskData,
  UpdateTaskData,
  TaskStatus,
  AssignTaskData,
  AddTaskCommentData,
  TaskComment,
} from "@/types/tasks";

interface TasksContextType {
  tasks: Task[];
  loading: boolean;
  // Task CRUD operations
  createTask: (
    taskData: CreateTaskData
  ) => Promise<{ task?: Task; message?: string }>;
  updateTask: (
    taskId: string,
    taskData: UpdateTaskData
  ) => Promise<{ task?: Task; message?: string }>;
  deleteTask: (
    taskId: string
  ) => Promise<{ status?: number; message?: string }>;
  // Task-specific operations
  assignTask: (
    taskId: string,
    assignData: AssignTaskData
  ) => Promise<{ task?: Task; message?: string }>;
  updateTaskStatus: (
    taskId: string,
    status: TaskStatus,
    comment?: string,
    blockReason?: string
  ) => Promise<{ task?: Task; message?: string }>;
  addTaskComment: (
    taskId: string,
    commentData: AddTaskCommentData
  ) => Promise<{ comment?: TaskComment; task?: Task; message?: string }>;
  // Data fetching helpers
  refreshTasks: () => Promise<void>;
  getTasksByGroup: (groupId: string) => Task[];
  getTasksByEvent: (eventId: string) => Task[];
}

const TasksContext = createContext<TasksContextType | null>(null);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  /**
   * Create a new task
   */
  const createTask = async (taskData: CreateTaskData) => {
    try {
      const response = await TasksAPI.create(taskData);
      console.log("Created Task from response:", response.task);

      if (response.task) {
        setTasks((prev) => [...prev, response.task]);
      }

      return response;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  };

  /**
   * Update an existing task
   */
  const updateTask = async (taskId: string, taskData: UpdateTaskData) => {
    try {
      const response = await TasksAPI.update(taskId, taskData);
      console.log("Updated Task from response:", response.task);

      if (response.task) {
        setTasks((prev) =>
          prev.map((task) => (task._id === taskId ? response.task! : task))
        );
      }

      return response;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  /**
   * Delete a task
   */
  const deleteTask = async (taskId: string) => {
    try {
      console.log("Entered context delete function:", taskId);

      // Optimistically remove from state
      setTasks((prev) => {
        console.log(
          "[TasksContext] before delete:",
          prev.map((t) => t._id)
        );
        const next = prev.filter((task) => task._id !== taskId);
        console.log(
          "[TasksContext] after delete:",
          next.map((t) => t._id)
        );
        return next;
      });

      const response = await TasksAPI.delete(taskId);
      return response;
    } catch (error) {
      console.error("Error deleting task:", error);
      // Revert optimistic update on error
      await refreshTasks();
      throw error;
    }
  };

  /**
   * Assign/unassign users to a task
   */
  const assignTask = async (taskId: string, assignData: AssignTaskData) => {
    try {
      const response = await TasksAPI.assign(taskId, assignData);
      console.log("Assigned Task from response:", response.task);

      if (response.task) {
        setTasks((prev) =>
          prev.map((task) => (task._id === taskId ? response.task! : task))
        );
      }

      return response;
    } catch (error) {
      console.error("Error assigning task:", error);
      throw error;
    }
  };

  /**
   * Update task status
   */
  const updateTaskStatus = async (
    taskId: string,
    status: TaskStatus,
    comment?: string,
    blockReason?: string
  ) => {
    try {
      const response = await TasksAPI.updateStatus(taskId, {
        status,
        comment,
        blockReason,
      });
      console.log("Updated Task Status from response:", response.task);

      if (response.task) {
        setTasks((prev) =>
          prev.map((task) => (task._id === taskId ? response.task! : task))
        );
      }

      return response;
    } catch (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  };

  /**
   * Add comment to task
   */
  const addTaskComment = async (
    taskId: string,
    commentData: AddTaskCommentData
  ) => {
    try {
      const response = await TasksAPI.addComment(taskId, commentData);
      console.log("Added Task Comment from response:", response.comment);

      if (response.task) {
        setTasks((prev) =>
          prev.map((task) => (task._id === taskId ? response.task! : task))
        );
      }

      return response;
    } catch (error) {
      console.error("Error adding task comment:", error);
      throw error;
    }
  };

  /**
   * Refresh tasks from API
   */
  const refreshTasks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await TasksAPI.getAll();
      if (response.tasks) {
        setTasks(response.tasks);
        console.log("Refreshed tasks in TasksContext:", response.tasks);
      }
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get tasks filtered by group
   */
  const getTasksByGroup = (groupId: string): Task[] => {
    return tasks.filter((task) => task.group.id === groupId);
  };

  /**
   * Get tasks filtered by event
   */
  const getTasksByEvent = (eventId: string): Task[] => {
    return tasks.filter((task) => task.event?.id === eventId);
  };

  // Load tasks when user changes
  useEffect(() => {
    (async () => {
      if (user) {
        setLoading(true);
        try {
          // Fetch tasks for the authenticated user
          const response = await TasksAPI.getAll();
          if (response.tasks) {
            setTasks(response.tasks);
            console.log(
              "Initial tasks loaded in TasksContext:",
              response.tasks
            );
          }
        } catch (error) {
          console.error("Error fetching tasks:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // Clear tasks when user logs out
        setTasks([]);
      }
    })();
  }, [user]);

  return (
    <TasksContext.Provider
      value={{
        tasks,
        loading,
        createTask,
        updateTask,
        deleteTask,
        assignTask,
        updateTaskStatus,
        addTaskComment,
        refreshTasks,
        getTasksByGroup,
        getTasksByEvent,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => {
  const context = React.useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
};
