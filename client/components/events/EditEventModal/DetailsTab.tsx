"use client";

import React, { useState } from "react";
import { Event, UpdateEventData } from "@/types/events";
import { Loader2 } from "lucide-react";

interface DetailsTabProps {
  event: Event;
  onSave: (data: UpdateEventData) => Promise<void>;
  isSaving?: boolean;
}

/**
 * DetailsTab Component
 * Form for editing event details (name, description, date, location, settings)
 */
export const DetailsTab: React.FC<DetailsTabProps> = ({
  event,
  onSave,
  isSaving = false,
}) => {
  // Convert ISO string to YYYY-MM-DD format for date input
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const [formData, setFormData] = useState<UpdateEventData>({
    name: event.name,
    description: event.description || "",
    startDate: event.startDate,
    endDate: event.endDate,
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
    rsvpDeadline: event.rsvpDeadline,
    dressCode: event.dressCode || "",
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const { name, value, type } = target;
    const checked = (target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number" && value
          ? parseInt(value)
          : value,
    }));
    setHasChanges(true);
  };

  const handleDateChange = (field: string, value: string) => {
    // Convert YYYY-MM-DD to ISO datetime
    const isoDate = new Date(`${value}T00:00:00Z`).toISOString();
    setFormData((prev) => ({
      ...prev,
      [field]: isoDate,
    }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving event details:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      {/* Event Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Event Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          placeholder="Event name"
          disabled={isSaving}
          className="w-full px-3 py-2 border rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 border-[var(--border)]"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          placeholder="Event description"
          disabled={isSaving}
          className="w-full px-3 py-2 border rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 border-[var(--border)] resize-none"
          rows={3}
        />
      </div>

      {/* Date and Time Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={formatDateForInput(formData.startDate)}
            onChange={(e) => handleDateChange("startDate", e.target.value)}
            disabled={isSaving}
            className="w-full px-3 py-2 border rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 border-[var(--border)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            End Date
          </label>
          <input
            type="date"
            value={formatDateForInput(formData.endDate)}
            onChange={(e) => handleDateChange("endDate", e.target.value)}
            disabled={isSaving}
            className="w-full px-3 py-2 border rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 border-[var(--border)]"
          />
        </div>
      </div>

      {/* All Day Toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isAllDay"
          name="isAllDay"
          checked={formData.isAllDay || false}
          onChange={handleChange}
          disabled={isSaving}
          className="w-4 h-4 rounded border-[var(--border)] cursor-pointer"
        />
        <label
          htmlFor="isAllDay"
          className="text-sm font-medium cursor-pointer"
        >
          All Day Event
        </label>
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Timezone
        </label>
        <input
          type="text"
          name="timezone"
          value={formData.timezone || "UTC"}
          onChange={handleChange}
          disabled={isSaving}
          className="w-full px-3 py-2 border rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 border-[var(--border)]"
          placeholder="UTC"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Location
        </label>
        <input
          type="text"
          name="location"
          value={formData.location || ""}
          onChange={handleChange}
          placeholder="Physical location or venue"
          disabled={isSaving}
          className="w-full px-3 py-2 border rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 border-[var(--border)]"
        />
      </div>

      {/* Virtual Toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isVirtual"
          name="isVirtual"
          checked={formData.isVirtual || false}
          onChange={handleChange}
          disabled={isSaving}
          className="w-4 h-4 rounded border-[var(--border)] cursor-pointer"
        />
        <label
          htmlFor="isVirtual"
          className="text-sm font-medium cursor-pointer"
        >
          Virtual Event
        </label>
      </div>

      {/* Location URL */}
      {formData.isVirtual && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Location URL
          </label>
          <input
            type="url"
            name="locationUrl"
            value={formData.locationUrl || ""}
            onChange={handleChange}
            placeholder="https://zoom.us/j/..."
            disabled={isSaving}
            className="w-full px-3 py-2 border rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 border-[var(--border)]"
          />
        </div>
      )}

      {/* Event Settings Section */}
      <div className="border-t border-[var(--border)] pt-4 space-y-4">
        <h3 className="font-semibold text-foreground">Event Settings</h3>

        {/* Private Event */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPrivate"
            name="isPrivate"
            checked={formData.isPrivate || false}
            onChange={handleChange}
            disabled={isSaving}
            className="w-4 h-4 rounded border-[var(--border)] cursor-pointer"
          />
          <label
            htmlFor="isPrivate"
            className="text-sm font-medium cursor-pointer"
          >
            Private Event
          </label>
        </div>

        {/* Allow Guest Invites */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="allowGuestInvites"
            name="allowGuestInvites"
            checked={formData.allowGuestInvites !== false}
            onChange={handleChange}
            disabled={isSaving}
            className="w-4 h-4 rounded border-[var(--border)] cursor-pointer"
          />
          <label
            htmlFor="allowGuestInvites"
            className="text-sm font-medium cursor-pointer"
          >
            Allow Guest Invites
          </label>
        </div>

        {/* Require RSVP */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requireRSVP"
            name="requireRSVP"
            checked={formData.requireRSVP !== false}
            onChange={handleChange}
            disabled={isSaving}
            className="w-4 h-4 rounded border-[var(--border)] cursor-pointer"
          />
          <label
            htmlFor="requireRSVP"
            className="text-sm font-medium cursor-pointer"
          >
            Require RSVP
          </label>
        </div>

        {/* Max Attendees */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Max Attendees (leave blank for unlimited)
          </label>
          <input
            type="number"
            name="maxAttendees"
            value={formData.maxAttendees || ""}
            onChange={handleChange}
            placeholder="Unlimited"
            disabled={isSaving}
            className="w-full px-3 py-2 border rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 border-[var(--border)]"
            min="1"
          />
        </div>
      </div>

      {/* Additional Details Section */}
      <div className="border-t border-[var(--border)] pt-4 space-y-4">
        <h3 className="font-semibold text-foreground">Additional Details</h3>

        {/* Creator Message */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Message to Invitees
          </label>
          <textarea
            name="creatorMessage"
            value={formData.creatorMessage || ""}
            onChange={handleChange}
            placeholder="Special message for invited guests"
            disabled={isSaving}
            className="w-full px-3 py-2 border rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 border-[var(--border)] resize-none"
            rows={2}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {(formData.creatorMessage || "").length}/500 characters
          </p>
        </div>

        {/* Dress Code */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Dress Code
          </label>
          <input
            type="text"
            name="dressCode"
            value={formData.dressCode || ""}
            onChange={handleChange}
            placeholder="e.g., Casual, Business Casual, Formal"
            disabled={isSaving}
            className="w-full px-3 py-2 border rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 border-[var(--border)]"
            maxLength={100}
          />
        </div>

        {/* RSVP Deadline */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            RSVP Deadline
          </label>
          <input
            type="date"
            value={formatDateForInput(formData.rsvpDeadline)}
            onChange={(e) => handleDateChange("rsvpDeadline", e.target.value)}
            disabled={isSaving}
            className="w-full px-3 py-2 border rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 border-[var(--border)]"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-[var(--border)] flex gap-3">
        <button
          type="submit"
          disabled={isSaving || !hasChanges}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};
