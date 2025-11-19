"use client";

import React, { useState } from "react";
import { X, Calendar, MapPin, Users, Globe } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { CreateEventData } from "@/types/events";
import { useAuth } from "@/context/AuthContext";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEventData) => Promise<void>;
  isLoading?: boolean;
  availableGroups?: Array<{
    id: string;
    name: string;
    type: "family" | "friends" | "work" | "other";
  }>;
}

/**
 * CreateEventModal Component
 * Modal form for creating new events with validation
 */
export default function CreateEventModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  availableGroups = [],
}: CreateEventModalProps) {
  // Form state
  const [formData, setFormData] = useState<Partial<CreateEventData>>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    isAllDay: false,
    timezone: "UTC",
    location: "",
    locationUrl: "",
    isVirtual: false,
    owner: { id: "", name: "", email: "" },
    group: undefined,
    isPrivate: false,
    allowGuestInvites: true,
    requireRSVP: true,
    maxAttendees: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();

  /**
   * Handle input change
   */
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (name === "group" && value !== "") {
      const selectedGroup = availableGroups.find((group) => group.id === value);
      setFormData((prev) => ({
        ...prev,
        group: selectedGroup
          ? {
              id: selectedGroup.id,
              name: selectedGroup.name,
              type: selectedGroup.type,
            }
          : undefined,
      }));
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
      return;
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : type === "number" && value
            ? parseInt(value)
            : value,
      }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
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

    if (!validateForm()) {
      return;
    }

    try {
      const eventData: CreateEventData = {
        name: formData.name!,
        description: formData.description || undefined,
        startDate: formData.startDate!,
        endDate: formData.endDate || undefined,
        isAllDay: formData.isAllDay || false,
        timezone: formData.timezone || "UTC",
        location: formData.location || undefined,
        locationUrl: formData.locationUrl || undefined,
        isVirtual: formData.isVirtual || false,
        group: formData.group || undefined,
        owner: {
          id: user?.id || "",
          name: user?.name || "",
          email: user?.email || "",
        },
        isPrivate: formData.isPrivate || false,
        allowGuestInvites: formData.allowGuestInvites ?? true,
        requireRSVP: formData.requireRSVP ?? true,
        maxAttendees: formData.maxAttendees || undefined,
      };

      await onSubmit(eventData);
      handleClose();
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  /**
   * Reset form and close modal
   */
  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      isAllDay: false,
      timezone: "UTC",
      location: "",
      locationUrl: "",
      isVirtual: false,
      owner: { id: "", name: "", email: "" },
      group: {
        id: "",
        name: "",
        type: "other",
      },
      isPrivate: false,
      allowGuestInvites: true,
      requireRSVP: true,
      maxAttendees: undefined,
    });
    setErrors({});
    onClose();
  };

  /**
   * Get today's date in YYYY-MM-DD format for min date
   */
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Event"
      size="lg"
    >
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
              value={formData.startDate || ""}
              onChange={handleInputChange}
              min={getTodayDate()}
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
              value={formData.endDate || ""}
              onChange={handleInputChange}
              min={formData.startDate || getTodayDate()}
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

        {/* Group Selection */}
        {availableGroups.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 font-inter">
              <Users className="h-4 w-4 inline mr-1" />
              Associate with Group
            </label>
            <select
              name="group"
              value={formData.group?.id || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Standalone Event</option>
              {availableGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.type})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Group members will be automatically notified
            </p>
          </div>
        )}

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
          </div>
        </div>

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
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin inline-block h-4 w-4 border-[3px] border-current border-t-transparent rounded-full mr-2"></div>
                Creating Event...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 inline mr-2" />
                Create Event
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
