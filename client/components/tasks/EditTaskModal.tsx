"use client";

import React, { useState } from "react";
import { Calendar, Flag, Settings, Save } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Task, UpdateTaskData } from "@/types/tasks";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskId: string, data: UpdateTaskData) => Promise<void>;
  isLoading?: boolean;
  task: Task | null;
}

/**
 * EditTaskModal Component
 * Modal form for editing existing tasks with validation
 */
export default function EditTaskModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  task,
}: EditTaskModalProps) {
  // Form state - initialize with task data when available
  const [formData, setFormData] = useState<Partial<UpdateTaskData>>(() => {
    if (!task || !isOpen) return {};
    return {
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate || "",
      allowSelfAssign: task.allowSelfAssign,
      requiresVerification: task.requiresVerification,
      status: task.status,
      blockReason: task.blockReason || "",
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Handle input change
   */
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      };

      // Check if there are changes compared to original task
      if (task) {
        const hasFieldChanges = Object.keys(newData).some((key) => {
          const fieldName = key as keyof UpdateTaskData;
          const originalValue = task[fieldName as keyof Task];
          const newValue = newData[fieldName];

          // Handle different types of comparisons
          if (originalValue !== newValue) {
            // Special handling for empty strings vs undefined
            if (
              (originalValue === undefined || originalValue === null) &&
              newValue === ""
            ) {
              return false;
            }
            if (
              (newValue === undefined || newValue === null) &&
              originalValue === ""
            ) {
              return false;
            }
            return true;
          }
          return false;
        });
        setHasChanges(hasFieldChanges);
      }

      return newData;
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /**
   * Format date for date input
   */
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.title?.trim()) {
      newErrors.title = "Task title is required";
    }

    // Due date validation - can't be in the past unless task is already completed
    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (
        dueDate < today &&
        formData.status !== "completed" &&
        formData.status !== "verified"
      ) {
        newErrors.dueDate = "Due date cannot be in the past for active tasks";
      }
    }

    // Block reason validation - required if status is blocked
    if (formData.status === "blocked" && !formData.blockReason?.trim()) {
      newErrors.blockReason =
        "Block reason is required when marking task as blocked";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!task) return;

    if (!validateForm()) {
      return;
    }

    if (!hasChanges) {
      handleClose();
      return;
    }

    try {
      // Only send changed fields
      const updateData: UpdateTaskData = {};

      Object.entries(formData).forEach(([key, newValue]) => {
        const fieldName = key as keyof UpdateTaskData;
        const originalValue = task[fieldName as keyof Task];

        if (originalValue !== newValue) {
          // Handle empty strings vs undefined for optional fields
          if (
            (originalValue === undefined || originalValue === null) &&
            newValue === ""
          ) {
            return; // Skip this field
          }
          if (
            (newValue === undefined || newValue === null) &&
            originalValue === ""
          ) {
            return; // Skip this field
          }

          // Handle null for dueDate when clearing
          if (fieldName === "dueDate" && newValue === "") {
            Object.assign(updateData, { [fieldName]: null });
          } else {
            // Type-safe assignment using object spread
            Object.assign(updateData, { [fieldName]: newValue });
          }
        }
      });

      await onSubmit(task._id, updateData);
      handleClose();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  /**
   * Reset form and close modal
   */
  const handleClose = () => {
    onClose();
  };

  /**
   * Get today's date in YYYY-MM-DD format for min date
   */
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  if (!task) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Task" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 p-4">
        {/* Task Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2 font-inter">
            Task Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title || ""}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.title ? "border-red-500" : "border-border"
            }`}
            placeholder="Enter task title"
            maxLength={200}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Task Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2 font-inter">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe the task..."
            maxLength={1000}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {(formData.description || "").length}/1000 characters
          </p>
        </div>

        {/* Priority and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 font-inter">
              <Flag className="h-4 w-4 inline mr-1" />
              Priority *
            </label>
            <select
              name="priority"
              value={formData.priority || "medium"}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2 font-inter">
              Category *
            </label>
            <select
              name="category"
              value={formData.category || "other"}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="supplies">Supplies</option>
              <option value="logistics">Logistics</option>
              <option value="preparation">Preparation</option>
              <option value="chores">Chores</option>
              <option value="coordination">Coordination</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2 font-inter">
            <Calendar className="h-4 w-4 inline mr-1" />
            Due Date
          </label>
          <input
            type="date"
            name="dueDate"
            value={formatDateForInput(formData.dueDate || undefined)}
            onChange={handleInputChange}
            min={
              formData.status === "completed" || formData.status === "verified"
                ? undefined
                : getTodayDate()
            }
            className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.dueDate ? "border-red-500" : "border-border"
            }`}
          />
          {errors.dueDate && (
            <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Leave empty for no due date
          </p>
        </div>

        {/* Task Status */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2 font-inter">
            Task Status
          </label>
          <select
            name="status"
            value={formData.status || "not_started"}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
            <option value="verified">Verified</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            {formData.status === "not_started" &&
              "Task has not been started yet"}
            {formData.status === "in_progress" &&
              "Task is currently being worked on"}
            {formData.status === "blocked" &&
              "Task is blocked and cannot proceed"}
            {formData.status === "completed" && "Task has been completed"}
            {formData.status === "verified" &&
              "Task has been completed and verified"}
            {formData.status === "cancelled" && "Task has been cancelled"}
          </p>
        </div>

        {/* Block Reason (shown when status is blocked) */}
        {formData.status === "blocked" && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 font-inter">
              Block Reason *
            </label>
            <textarea
              name="blockReason"
              value={formData.blockReason || ""}
              onChange={handleInputChange}
              rows={2}
              className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.blockReason ? "border-red-500" : "border-border"
              }`}
              placeholder="Explain why this task is blocked..."
              maxLength={500}
            />
            {errors.blockReason && (
              <p className="mt-1 text-sm text-red-600">{errors.blockReason}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {(formData.blockReason || "").length}/500 characters
            </p>
          </div>
        )}

        {/* Task Settings */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-foreground font-inter flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Task Settings
          </h4>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="allowSelfAssign"
                checked={formData.allowSelfAssign ?? false}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-border rounded"
              />
              <label className="ml-2 text-sm text-foreground font-inter">
                Allow self-assignment
              </label>
              <p className="ml-2 text-xs text-muted-foreground">
                (Users can claim this task themselves)
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="requiresVerification"
                checked={formData.requiresVerification ?? false}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-border rounded"
              />
              <label className="ml-2 text-sm text-foreground font-inter">
                Requires verification
              </label>
              <p className="ml-2 text-xs text-muted-foreground">
                (Task completion must be verified by another user)
              </p>
            </div>
          </div>
        </div>

        {/* Group and Event Information (Read-only) */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Associated Group:
              </span>
              <span className="text-sm text-muted-foreground">
                {task.group?.name || "No Group"}{" "}
                {task.group?.type ? `(${task.group.type})` : ""}
              </span>
            </div>
            {task.event && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Associated Event:
                </span>
                <span className="text-sm text-muted-foreground">
                  {task.event.name}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Group and event associations cannot be changed after task creation
            </p>
          </div>
        </div>

        {/* Changes Indicator */}
        {hasChanges && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              You have unsaved changes
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !hasChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin inline-block h-4 w-4 border-[3px] border-current border-t-transparent rounded-full mr-2"></div>
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 inline mr-2" />
                {hasChanges ? "Save Changes" : "No Changes"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
