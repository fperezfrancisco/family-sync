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
import { EventAttendee } from "@/types";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (taskData: CreateTaskData) => Promise<void>;
  availableGroups?: Array<{
    id: string;
    name: string;
    type: "family" | "friends" | "work" | "other";
    members?: Array<{
      id: string;
      name: string;
      email: string;
      role: "owner" | "admin" | "member" | "guest";
    }>;
  }>;
  availableEvents?: Array<{
    id: string;
    name: string;
    startDate: string;
    group?: {
      id: string;
      name: string;
    };
    attendees?: Array<{
      id: string;
      name: string;
      email: string;
      role: "pending" | "attending" | "not_attending" | "maybe";
    }>;
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
  const [assignmentMode, setAssignmentMode] = useState<"self" | "assign">(
    "self"
  );
  const [taskType, setTaskType] = useState<"group" | "event">(
    defaultGroupId ? "group" : defaultEventId ? "event" : "group"
  );

  console.log("Available Events: ", availableEvents);

  // Computed properties for better UX
  const selectedGroup = React.useMemo(() => {
    console.log("Updating selected group.");
    return availableGroups?.find((g) => g.id === formData.groupId);
  }, [availableGroups, formData.groupId]);

  const selectedEvent = React.useMemo(() => {
    return availableEvents?.find((e) => e.id === formData.eventId);
  }, [availableEvents, formData.eventId]);

  // Get available users for assignment based on task type and selection
  const availableAssignees = React.useMemo(() => {
    if (taskType === "group" && selectedGroup?.members) {
      return selectedGroup.members;
    }
    if (taskType === "event" && selectedEvent?.attendees) {
      // For events, we can get attendees from the event
      // For now, we'll use the event's group members if available
      if (selectedEvent.attendees) {
        return selectedEvent.attendees;
      }
    }
    return [];
  }, [taskType, selectedGroup, selectedEvent]);

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
      setAssignmentMode("self");
      setTaskType(
        defaultGroupId ? "group" : defaultEventId ? "event" : "group"
      );
    }
  }, [isOpen, defaultGroupId, defaultEventId]);

  /**
   * Handle task type change (group vs event)
   */
  const handleTaskTypeChange = (newTaskType: "group" | "event") => {
    setTaskType(newTaskType);
    setFormData((prev) => ({
      ...prev,
      groupId: newTaskType === "group" ? defaultGroupId || "" : "",
      eventId: newTaskType === "event" ? defaultEventId || "" : undefined,
      assigneeIds: [], // Clear assignees when switching task type
    }));
    setErrors({}); // Clear all errors when switching
  };

  /**
   * Handle form field changes
   */
  const handleFieldChange = (
    field: keyof CreateTaskData,
    value: string | string[] | boolean | undefined
  ) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Clear assignees when group/event changes since available users change
      if ((field === "groupId" || field === "eventId") && value) {
        newData.assigneeIds = [];
      }

      return newData;
    });

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

    // Either group OR event must be selected (not both, not neither)
    if (!formData.groupId && !formData.eventId) {
      newErrors.groupId = "Please select a group or event";
    }

    // Cannot select both group and event
    if (formData.groupId && formData.eventId) {
      newErrors.groupId = "Cannot select both group and event. Choose one.";
    }

    console.log("Assignment mode: ", assignmentMode);

    // If assigning to users, must have at least one assignee
    if (
      assignmentMode === "assign" &&
      (!formData.assigneeIds || formData.assigneeIds.length === 0)
    ) {
      newErrors.assigneeIds =
        "Please select at least one person to assign this task to";
    }

    // If assignment mode is "assign", disable self-assign
    if (assignmentMode === "assign" && formData.allowSelfAssign) {
      newErrors.assignmentMode =
        "Cannot allow self-assignment when assigning to specific users";
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
        assigneeIds:
          assignmentMode === "assign" && formData.assigneeIds?.length
            ? formData.assigneeIds
            : undefined,
        dueDate: formData.dueDate || undefined,
        eventId: formData.eventId || undefined,
        allowSelfAssign: assignmentMode === "self" ? true : false, // Disable self-assign when assigning to specific users
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

            {/* Context Selection: Group OR Event (Mutually Exclusive) */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-3">
                Task Context *
              </label>

              {defaultGroupId ? (
                <div className="bg-[var(--primary)] border border-[var(--border)] rounded-md p-4">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Creating task for group: {selectedGroup?.name}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Type: {selectedGroup?.type}
                      </p>
                    </div>
                  </div>
                </div>
              ) : defaultEventId ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Creating task for event: {selectedEvent?.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Date:{" "}
                        {selectedEvent
                          ? new Date(
                              selectedEvent.startDate
                            ).toLocaleDateString()
                          : ""}
                      </p>
                      {selectedEvent?.group && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Associated with group: {selectedEvent.group.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Task Type Toggle Switch (only show if both groups and events are available) */}
                  {availableGroups.length > 0 && availableEvents.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-[var(--muted)] rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Users
                          className={`h-4 w-4 ${
                            taskType === "group"
                              ? "text-[var(--primary)]"
                              : "text-white"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            taskType === "group"
                              ? "text-[var(--primary)]"
                              : "text-white"
                          }`}
                        >
                          Group Task
                        </span>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() =>
                          handleTaskTypeChange(
                            taskType === "group" ? "event" : "group"
                          )
                        }
                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${
                          taskType === "event"
                            ? "bg-[var(--primary)]"
                            : "bg-[var(--border)]"
                        }`}
                        disabled={isSubmitting}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            taskType === "event"
                              ? "translate-x-7"
                              : "translate-x-1"
                          }`}
                        />
                      </button>

                      <div className="flex items-center space-x-3">
                        <Calendar
                          className={`h-4 w-4 ${
                            taskType === "event"
                              ? "text-[var(--primary)]"
                              : "text-white"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            taskType === "event"
                              ? "text-[var(--primary)]"
                              : "text-white"
                          }`}
                        >
                          Event Task
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Group Selection */}
                  {taskType === "group" && availableGroups.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                        <Users className="h-4 w-4 inline mr-1" />
                        Select Group
                      </label>
                      <select
                        value={formData.groupId}
                        onChange={(e) =>
                          handleFieldChange("groupId", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                        disabled={isSubmitting}
                      >
                        <option value="">Select a group...</option>
                        {availableGroups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name} ({group.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Event Selection */}
                  {taskType === "event" && availableEvents.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Select Event
                      </label>
                      <select
                        value={formData.eventId || ""}
                        onChange={(e) =>
                          handleFieldChange("eventId", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                        disabled={isSubmitting}
                      >
                        <option value="">Select an event...</option>
                        {availableEvents.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.name} -{" "}
                            {new Date(event.startDate).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Fallback: Show only available option if only one type exists */}
                  {availableGroups.length > 0 &&
                    availableEvents.length === 0 &&
                    taskType === "event" && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                          <Users className="h-4 w-4 inline mr-1" />
                          Select Group
                        </label>
                        <select
                          value={formData.groupId}
                          onChange={(e) =>
                            handleFieldChange("groupId", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                          disabled={isSubmitting}
                        >
                          <option value="">Select a group...</option>
                          {availableGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name} ({group.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                  {availableEvents.length > 0 &&
                    availableGroups.length === 0 &&
                    taskType === "group" && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Select Event
                        </label>
                        <select
                          value={formData.eventId || ""}
                          onChange={(e) =>
                            handleFieldChange("eventId", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                          disabled={isSubmitting}
                        >
                          <option value="">Select an event...</option>
                          {availableEvents.map((event) => (
                            <option key={event.id} value={event.id}>
                              {event.name} -{" "}
                              {new Date(event.startDate).toLocaleDateString()}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                </div>
              )}

              {errors.groupId && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {errors.groupId}
                </p>
              )}
              {errors.eventId && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {errors.eventId}
                </p>
              )}
            </div>

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

            {/* Assignment Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-3">
                <User className="h-4 w-4 inline mr-1" />
                Task Assignment
              </label>

              <div className="space-y-3">
                {/* Assignment Mode Toggle */}
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="assignmentMode"
                      value="self"
                      checked={assignmentMode === "self"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignmentMode("self");
                          setFormData((prev) => ({
                            ...prev,
                            allowSelfAssign: true,
                            assigneeIds: [],
                          }));
                        }
                      }}
                      className="h-4 w-4 text-[var(--primary)]"
                      disabled={isSubmitting}
                    />
                    <span className="ml-2 text-sm text-[var(--foreground)]">
                      Allow self-assignment
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="assignmentMode"
                      value="assign"
                      checked={assignmentMode === "assign"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignmentMode("assign");
                          setFormData((prev) => ({
                            ...prev,
                            allowSelfAssign: false,
                          }));
                        }
                      }}
                      className="h-4 w-4 text-[var(--primary)]"
                      disabled={isSubmitting || availableAssignees.length === 0}
                    />
                    <span className="ml-2 text-sm text-[var(--foreground)]">
                      Assign to specific users
                    </span>
                  </label>
                </div>

                {/* Assignment Mode Description */}
                {assignmentMode === "self" ? (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Users can assign themselves to this task when they want to
                    work on it.
                  </p>
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Choose specific users to assign this task to. They will be
                    notified.
                  </p>
                )}

                {/* Assignee Selection - Only show if assign mode and users available */}
                {assignmentMode === "assign" &&
                  availableAssignees.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                        Select People to Assign *
                      </label>
                      <div className="border border-[var(--border)] rounded-md">
                        {availableAssignees.map((user, index) => (
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
                                {user.email} • {user.role}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                {/* No users available message */}
                {assignmentMode === "assign" &&
                  availableAssignees.length === 0 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        No users available to assign. Please select a group or
                        event first.
                      </p>
                    </div>
                  )}

                {/* Assignment validation errors */}
                {errors.assigneeIds && (
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    {errors.assigneeIds}
                  </p>
                )}
                {errors.assignmentMode && (
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    {errors.assignmentMode}
                  </p>
                )}
              </div>
            </div>

            {/* Other Options */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-3">
                <Settings className="h-4 w-4 inline mr-1" />
                Additional Options
              </label>
              <div className="space-y-3">
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
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border)]">
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
