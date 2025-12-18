"use client";

import React, { useState } from "react";
import {
  MapPin,
  Users,
  Globe,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Event, UpdateEventData } from "@/types/events";
import { AppearanceTab } from "@/components/groups/EditGroupModal/AppearanceTab";
import { EventsAPI } from "@/lib/api";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventId: string, data: UpdateEventData) => Promise<void>;
  isLoading?: boolean;
  event: Event | null;
}

/**
 * EditEventModal Component
 * Multi-tab modal form for editing existing events with validation
 * Tabs: Details (event info), Appearance (image/color customization)
 */
export default function EditEventModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  event,
}: EditEventModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "appearance">(
    "details"
  );
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form state - initialize with event data when available
  const [formData, setFormData] = useState<Partial<UpdateEventData>>(() => {
    if (!event || !isOpen) return {};
    return {
      name: event.name,
      description: event.description || "",
      startDate: event.startDate,
      endDate: event.endDate || "",
      isAllDay: event.isAllDay,
      timezone: event.timezone,
      location: event.location || "",
      locationUrl: event.locationUrl || "",
      isVirtual: event.isVirtual,
      isPrivate: event.isPrivate,
      allowGuestInvites: event.allowGuestInvites,
      requireRSVP: event.requireRSVP,
      maxAttendees: event.maxAttendees,
      creatorMessage: event.creatorMessage || "",
      rsvpDeadline: event.rsvpDeadline || "",
      dressCode: event.dressCode || "",
      status: event.status,
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
          type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : type === "number" && value
            ? parseInt(value)
            : value,
      };

      // Check if there are changes compared to original event
      if (event) {
        const hasFieldChanges = Object.keys(newData).some((key) => {
          const fieldName = key as keyof UpdateEventData;
          const originalValue = event[fieldName];
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
   * Format date for datetime-local input
   */
  const formatDateForInput = (
    dateString: string | undefined,
    isAllDay: boolean = false
  ) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isAllDay) {
      return date.toISOString().split("T")[0];
    } else {
      // Format for datetime-local input (YYYY-MM-DDTHH:mm)
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      return localDate.toISOString().slice(0, 16);
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name?.trim()) {
      newErrors.name = "Event name is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    // Date validation
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end <= start) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    // Max attendees validation
    if (formData.maxAttendees && formData.maxAttendees < 1) {
      newErrors.maxAttendees = "Maximum attendees must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!event) return;

    if (!validateForm()) {
      return;
    }

    if (!hasChanges) {
      handleClose();
      return;
    }

    try {
      // Only send changed fields
      const updateData: UpdateEventData = {};

      Object.entries(formData).forEach(([key, newValue]) => {
        const fieldName = key as keyof UpdateEventData;
        const originalValue = event[fieldName];

        if (originalValue !== newValue) {
          // Handle empty strings vs undefined
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

          // Convert rsvpDeadline to ISO datetime format if it's being updated
          if (
            fieldName === "rsvpDeadline" &&
            newValue &&
            typeof newValue === "string"
          ) {
            // Check if it's already in ISO format or needs conversion
            if (!newValue.includes("T")) {
              // Input format from date picker: YYYY-MM-DD
              // Convert to ISO datetime: YYYY-MM-DDTHH:MM:SSZ
              const dateObj = new Date(newValue + "T00:00:00Z");
              Object.assign(updateData, { [fieldName]: dateObj.toISOString() });
              return;
            }
          }

          // Type-safe assignment using object spread
          Object.assign(updateData, { [fieldName]: newValue });
        }
      });

      await onSubmit(event.id, updateData);
      handleClose();
    } catch (error) {
      console.error("Error updating event:", error);
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

  /**
   * Handle appearance tab save (customization)
   */
  const handleAppearanceSave = async (customization: {
    headerImage: { source: "preset" | "custom"; value: string };
    accentColor: { preset: string; hex: string };
  }) => {
    setIsSavingAppearance(true);
    setError("");
    setSuccess("");
    try {
      await EventsAPI.update(event!.id, { customization } as UpdateEventData);
      setSuccess("Event appearance updated successfully");
      setTimeout(() => setSuccess(""), 3000); // Auto-clear after 3 seconds
    } catch (err) {
      console.error("Error updating appearance:", err);
      setError("Failed to update event appearance");
    } finally {
      setIsSavingAppearance(false);
    }
  };

  if (!event) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit Event: ${event.name}`}
      size="lg"
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
            activeTab === "details"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab("appearance")}
          className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
            activeTab === "appearance"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Appearance
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span className="text-sm text-red-700 dark:text-red-300">
            {error}
          </span>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <span className="text-sm text-green-700 dark:text-green-300">
            {success}
          </span>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === "details" && (
        <form onSubmit={handleSubmit} className="space-y-6 p-4">
          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 font-inter">
              Event Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? "border-red-500" : "border-border"
              }`}
              placeholder="Enter event name"
              maxLength={200}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Event Description */}
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
              placeholder="Describe your event..."
              maxLength={2000}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {(formData.description || "").length}/2000 characters
            </p>
          </div>

          {/* Date and Time Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 font-inter">
                Start Date & Time *
              </label>
              <input
                type={formData.isAllDay ? "date" : "datetime-local"}
                name="startDate"
                value={formatDateForInput(
                  formData.startDate,
                  formData.isAllDay
                )}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.startDate ? "border-red-500" : "border-border"
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2 font-inter">
                End Date & Time
              </label>
              <input
                type={formData.isAllDay ? "date" : "datetime-local"}
                name="endDate"
                value={formatDateForInput(formData.endDate, formData.isAllDay)}
                onChange={handleInputChange}
                min={
                  formData.startDate
                    ? formatDateForInput(formData.startDate, formData.isAllDay)
                    : getTodayDate()
                }
                className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.endDate ? "border-red-500" : "border-border"
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isAllDay"
              checked={formData.isAllDay || false}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-border rounded"
            />
            <label className="ml-2 text-sm text-foreground font-inter">
              All day event
            </label>
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isVirtual"
                checked={formData.isVirtual || false}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-border rounded"
              />
              <label className="ml-2 text-sm text-foreground font-inter">
                Virtual event
              </label>
            </div>

            {!formData.isVirtual && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 font-inter">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event location"
                  maxLength={500}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2 font-inter">
                <Globe className="h-4 w-4 inline mr-1" />
                {formData.isVirtual ? "Meeting Link" : "Location URL"}
              </label>
              <input
                type="url"
                name="locationUrl"
                value={formData.locationUrl || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  formData.isVirtual
                    ? "https://zoom.us/j/..."
                    : "https://maps.google.com/..."
                }
              />
            </div>
          </div>

          {/* Event Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 font-inter">
              Event Status
            </label>
            <select
              name="status"
              value={formData.status || "draft"}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {formData.status === "draft" && "Event is visible only to you"}
              {formData.status === "published" &&
                "Event is visible to invitees and group members"}
              {formData.status === "cancelled" && "Event has been cancelled"}
              {formData.status === "completed" && "Event has ended"}
            </p>
          </div>

          {/* Event Settings */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-foreground font-inter">
              Event Settings
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPrivate"
                  checked={formData.isPrivate || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-border rounded"
                />
                <label className="ml-2 text-sm text-foreground font-inter">
                  Private event
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="requireRSVP"
                  checked={formData.requireRSVP ?? true}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-border rounded"
                />
                <label className="ml-2 text-sm text-foreground font-inter">
                  Require RSVP
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="allowGuestInvites"
                  checked={formData.allowGuestInvites ?? true}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-border rounded"
                />
                <label className="ml-2 text-sm text-foreground font-inter">
                  Allow guest invites
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1 font-inter">
                  Max Attendees
                </label>
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees || ""}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.maxAttendees ? "border-red-500" : "border-border"
                  }`}
                  placeholder="No limit"
                />
                {errors.maxAttendees && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.maxAttendees}
                  </p>
                )}
              </div>

              {/* Creator Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1 font-inter">
                  Message to Guests (Optional)
                </label>
                <textarea
                  name="creatorMessage"
                  value={formData.creatorMessage || ""}
                  onChange={handleInputChange}
                  maxLength={500}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.creatorMessage ? "border-red-500" : "border-border"
                  }`}
                  placeholder="Share a personal message with your guests..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.creatorMessage?.length || 0}/500 characters
                </p>
              </div>

              {/* Dress Code */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1 font-inter">
                  Dress Code (Optional)
                </label>
                <input
                  type="text"
                  name="dressCode"
                  value={formData.dressCode || ""}
                  onChange={handleInputChange}
                  maxLength={100}
                  className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.dressCode ? "border-red-500" : "border-border"
                  }`}
                  placeholder="e.g., Business Casual, Formal, Smart Casual"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Examples: Formal, Business Casual, Casual, Black Tie
                </p>
              </div>

              {/* RSVP Deadline */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1 font-inter">
                  RSVP Deadline (Optional)
                </label>
                <input
                  type="date"
                  name="rsvpDeadline"
                  value={formData.rsvpDeadline || ""}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.rsvpDeadline ? "border-red-500" : "border-border"
                  }`}
                />
                {errors.rsvpDeadline && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.rsvpDeadline}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Group Information (Read-only) */}
          {event.group && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Associated Group:
                </span>
                <span className="text-sm text-muted-foreground">
                  {event.group.name} ({event.group.type})
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Group association cannot be changed after event creation
              </p>
            </div>
          )}

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
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <div className="p-4">
          <AppearanceTab
            groupName={event.name}
            groupType="event"
            customization={event.customization}
            onSave={handleAppearanceSave}
            isSaving={isSavingAppearance}
          />
        </div>
      )}
    </Modal>
  );
}
