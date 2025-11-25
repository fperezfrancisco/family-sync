"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Users,
  Calendar,
  Flag,
  Tag,
  User,
  FileText,
  Settings,
} from "lucide-react";
import { CreateTaskData, TaskPriority, TaskCategory } from "@/types/tasks";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (taskData: CreateTaskData) => Promise<void>;
  availableGroups?: Array<{
    id: string;
    name: string;
    type: "family" | "friends" | "work" | "other";
  }>;
  availableEvents?: Array<{
    id: string;
    name: string;
    startDate: string;
  }>;
  availableUsers?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  defaultGroupId?: string;
  defaultEventId?: string;
}

/**
 * CreateTaskModal Component
 * Modal for creating new tasks with comprehensive form fields
 */
export default function CreateTaskModal({
  isOpen,
  onClose,
  onCreateTask,
  availableGroups = [],
  availableEvents = [],
  availableUsers = [],
  defaultGroupId = "",
  defaultEventId = "",
}: CreateTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateTaskData>({
    title: "",
    description: "",
    groupId: defaultGroupId,
    eventId: defaultEventId || undefined,
    assigneeIds: [],
    priority: "medium",
    category: "other",
    dueDate: undefined,
    allowSelfAssign: true,
    requiresVerification: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Reset form when modal opens/closes
   */
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        description: "",
        groupId: defaultGroupId,
        eventId: defaultEventId || undefined,
        assigneeIds: [],
        priority: "medium",
        category: "other",
        dueDate: undefined,
        allowSelfAssign: true,
        requiresVerification: false,
      });
      setErrors({});
    }
  }, [isOpen, defaultGroupId, defaultEventId]);

  /**
   * Handle form field changes
   */
  const handleFieldChange = (
    field: keyof CreateTaskData,
    value: string | string[] | boolean | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle assignee selection
   */
  const handleAssigneeToggle = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds?.includes(userId)
        ? prev.assigneeIds.filter((id) => id !== userId)
        : [...(prev.assigneeIds || []), userId],
    }));
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    }

    // Group is only required if not creating task for an event
    if (!defaultEventId && !formData.groupId) {
      newErrors.groupId = "Please select a group";
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.dueDate = "Due date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Clean up form data
      const cleanFormData: CreateTaskData = {
        ...formData,
        description: formData.description?.trim() || undefined,
        assigneeIds: formData.assigneeIds?.length
          ? formData.assigneeIds
          : undefined,
        dueDate: formData.dueDate || undefined,
        eventId: formData.eventId || undefined,
      };

      await onCreateTask(cleanFormData);
      onClose();
    } catch (error) {
      console.error("Failed to create task:", error);
      setErrors({ submit: "Failed to create task. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="Enter task title..."
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {errors.title}
                </p>
              )}
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                placeholder="Enter task description..."
                rows={3}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                disabled={isSubmitting}
              />
            </div>

            {/* Group Selection */}
            {!defaultEventId && (
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  Group *
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) => handleFieldChange("groupId", e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] disabled:bg-muted disabled:cursor-not-allowed"
                  disabled={isSubmitting || !!defaultGroupId}
                >
                  <option value="">Select a group...</option>
                  {availableGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.type})
                    </option>
                  ))}
                </select>
                {defaultGroupId && availableGroups.length > 0 && (
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Creating task for current group
                  </p>
                )}
                {errors.groupId && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.groupId}
                  </p>
                )}
              </div>
            )}

            {/* Event Context Info */}
            {defaultEventId && availableEvents.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Creating task for event: {availableEvents[0].name}
                    </p>
                    {availableGroups.length > 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Associated with group: {availableGroups[0].name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Event Selection */}
            {availableEvents.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Related Event (Optional)
                </label>
                <select
                  value={formData.eventId || ""}
                  onChange={(e) => handleFieldChange("eventId", e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                  disabled={isSubmitting}
                >
                  <option value="">No related event</option>
                  {availableEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} -{" "}
                      {new Date(event.startDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  <Flag className="h-4 w-4 inline mr-1" />
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    handleFieldChange(
                      "priority",
                      e.target.value as TaskPriority
                    )
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                  disabled={isSubmitting}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  <Tag className="h-4 w-4 inline mr-1" />
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    handleFieldChange(
                      "category",
                      e.target.value as TaskCategory
                    )
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                  disabled={isSubmitting}
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
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={formData.dueDate || ""}
                onChange={(e) => handleFieldChange("dueDate", e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                disabled={isSubmitting}
              />
              {errors.dueDate && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {errors.dueDate}
                </p>
              )}
            </div>

            {/* Assignees */}
            {availableUsers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Assign to Users (Optional)
                </label>
                <div className="border border-[var(--border)] rounded-md max-h-40 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center p-3 hover:bg-[var(--muted)] cursor-pointer border-b border-[var(--border)] last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={
                          formData.assigneeIds?.includes(user.id) || false
                        }
                        onChange={() => handleAssigneeToggle(user.id)}
                        className="h-4 w-4 text-[var(--primary)] rounded focus:ring-2 focus:ring-[var(--primary)]"
                        disabled={isSubmitting}
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {user.name}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {user.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-3">
                <Settings className="h-4 w-4 inline mr-1" />
                Task Options
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowSelfAssign}
                    onChange={(e) =>
                      handleFieldChange("allowSelfAssign", e.target.checked)
                    }
                    className="h-4 w-4 text-[var(--primary)] rounded focus:ring-2 focus:ring-[var(--primary)]"
                    disabled={isSubmitting}
                  />
                  <span className="ml-2 text-sm text-[var(--foreground)]">
                    Allow users to assign themselves to this task
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.requiresVerification}
                    onChange={(e) =>
                      handleFieldChange(
                        "requiresVerification",
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 text-[var(--primary)] rounded focus:ring-2 focus:ring-[var(--primary)]"
                    disabled={isSubmitting}
                  />
                  <span className="ml-2 text-sm text-[var(--foreground)]">
                    Require verification when task is marked complete
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {errors.submit}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border)] ">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[var(--foreground)] bg-[var(--muted)] border border-[var(--border)] rounded-md hover:bg-[var(--muted)]/80"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary)]/80 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
