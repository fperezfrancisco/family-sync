"use client";

import React, { useState } from "react";
import {
  Trash2,
  Edit3,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Globe,
  Clock,
  User,
  Check,
  X,
  HelpCircle,
  Clock1,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Event, UpdateEventData } from "@/types/events";
import Modal from "@/components/ui/Modal";
import { useEvents } from "@/context/EventsContext";
import EditEventModal from "./EditEventModal";
import Image from "next/image";

interface EventHeaderProps {
  event: Event;
  currentUserId?: string;
  onEventUpdate?: () => void;
}

/**
 * Utility function to check if user can edit event
 * Only event owner can edit
 */
const canEditEvent = (event: Event, userId?: string): boolean => {
  if (!userId || !event.owner?.id) return false;
  return event.owner.id === userId || event.canEdit === true;
};

/**
 * Utility function to check if user can delete event
 * Only event owner can delete
 */
const canDeleteEvent = (event: Event, userId?: string): boolean => {
  if (!userId || !event.owner?.id) return false;
  return event.owner.id === userId || event.canDelete === true;
};

/**
 * Event Header Component
 * Displays event information and action buttons based on user permissions
 */
export default function EventHeader({
  event,
  currentUserId,
  onEventUpdate,
}: EventHeaderProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const { deleteEvent, editEvent, rsvpToEvent } = useEvents();

  const canEdit = canEditEvent(event, currentUserId);
  const canDelete = canDeleteEvent(event, currentUserId);

  // Get event status styling
  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Get RSVP status styling
  const getRSVPStatusColor = (status: Event["userRSVPStatus"]) => {
    switch (status) {
      case "attending":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "not_attending":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "maybe":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Helper function to create timezone-adjusted dates
  const createTimezoneAdjustedDate = (
    dateString: string,
    forceAdjust = false
  ) => {
    const date = new Date(dateString);
    // Adjust for timezone offset to prevent day shifting when needed
    if (forceAdjust) {
      const adjustedDate = new Date(
        date.getTime() + date.getTimezoneOffset() * 60000
      );
      return adjustedDate;
    }
    return date;
  };

  // Format date only (no time)
  const formatEventDate = (
    startDate: string,
    endDate?: string,
    isAllDay?: boolean
  ) => {
    const start = createTimezoneAdjustedDate(startDate, isAllDay);
    const end = endDate ? createTimezoneAdjustedDate(endDate, isAllDay) : null;

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    if (end && start.toDateString() !== end.toDateString()) {
      return `${start.toLocaleDateString(
        "en-US",
        dateOptions
      )} - ${end.toLocaleDateString("en-US", dateOptions)}`;
    }
    return start.toLocaleDateString("en-US", dateOptions);
  };

  // Format time only (for events with set times)
  const formatEventTime = (
    startDate: string,
    endDate?: string,
    isAllDay?: boolean
  ) => {
    if (isAllDay) return null;

    const start = createTimezoneAdjustedDate(startDate, false);
    const end = endDate ? createTimezoneAdjustedDate(endDate, false) : null;

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };

    const startTime = start.toLocaleTimeString("en-US", timeOptions);

    if (end) {
      const endTime = end.toLocaleTimeString("en-US", timeOptions);
      return `${startTime} - ${endTime}`;
    }

    return startTime;
  };

  // Handle edit event
  const handleEditEvent = () => {
    setIsEditModalOpen(true);
  };

  // Handle event update (placeholder for API integration)
  const handleEventUpdate = async (
    eventId: string,
    updateData: UpdateEventData
  ) => {
    try {
      // TODO: Implement API call to update event
      console.log("Updating event:", eventId, updateData);

      // Placeholder for actual API implementation:
      // const response = await updateEvent(eventId, updateData);
      // if (response) {
      //   onEventUpdate?.(); // Refresh event data
      // }
      const response = await editEvent(eventId, updateData); // For now, just show success message and refresh
      if (response) {
        console.log("Event updated: ", response);
        onEventUpdate?.(); // Refresh event data even with placeholder
      }
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event. Please try again.");
      throw error; // Re-throw to let the modal handle the error state
    }
  };

  // Handle delete event
  const handleDeleteEvent = async () => {
    try {
      setIsLoading(true);
      console.log("Delete event:", event.id);
      // Delete the event from context
      const response = await deleteEvent(event.id);

      if (response && response.message) {
        console.log("Event deleted: ", response.message);
        router.push("/dashboard/events");
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event. Please try again.");
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Handle RSVP
  const handleRSVP = async (
    status: "attending" | "not_attending" | "maybe"
  ) => {
    try {
      setRsvpLoading(true);
      console.log("RSVP to event:", event.id, "status:", status);
      const response = await rsvpToEvent(event.id, status);

      if (response) {
        console.log("RSVP successful: ", response);
        onEventUpdate?.(); // Refresh event data
      }
    } catch (error) {
      console.error("Failed to RSVP:", error);
      alert("Failed to update RSVP. Please try again.");
    } finally {
      setRsvpLoading(false);
    }
  };

  return (
    <>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="w-full aspect-[3/2] md:aspect-[24/9] bg-neutral-200 relative overflow-hidden">
          <div className="w-full h-full absolute z-[5] bg-black/20"></div>
          <Image
            src="/wallpapers/default-cabin.jpg"
            alt="User Wallpaper"
            width={2000}
            height={1000}
            className="object-cover bottom-0 h-full"
          />
        </div>

        {/* Navigation and Actions */}
        <div className="flex items-center justify-between hidden">
          {/* Action Buttons - Only show if user has permissions */}
          {(canEdit || canDelete) && (
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={handleEditEvent}
                  className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Event
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Event
                </button>
              )}
            </div>
          )}
        </div>

        <div className="w-full p-6 flex flex-col items-start gap-4">
          {/* Event Information */}
          <div className="w-full flex flex-wrap items-start gap-4">
            <div className="flex  flex-col items-start gap-2">
              {/* Title and Status */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] font-inter">
                      {event.name}
                    </h1>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                        event.status
                      )}`}
                    >
                      {event.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-[var(--muted-foreground)] text-lg leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>
            <div className="flex grow flex-col items-start gap-2">
              {/* Group Association */}
              {event.group && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="flex items-center flex-wrap gap-2">
                    <p className="text-sm text-foreground">
                      {event.group.name ? event.group.name : "Standalone"} Event
                    </p>
                    <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded capitalize">
                      {event.group.type}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-foreground mt-0.5" />
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-foreground">
                    {formatEventDate(
                      event.startDate,
                      event.endDate,
                      event.isAllDay
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!event.isAllDay &&
                  formatEventTime(
                    event.startDate,
                    event.endDate,
                    event.isAllDay
                  ) && (
                    <>
                      <Clock className="h-4 w-4 text-foreground" />
                      <p className="text-sm font-semibold text-foreground">
                        {formatEventTime(
                          event.startDate,
                          event.endDate,
                          event.isAllDay
                        )}
                      </p>
                    </>
                  )}
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                {event.isVirtual ? (
                  <Globe className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <MapPin className="h-5 w-5 text-foreground mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {event.location || "Location not specified"}
                  </p>
                  {event.locationUrl && (
                    <a
                      href={event.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-500 underline"
                    >
                      {event.isVirtual ? "Join Meeting" : "View on Map"}
                    </a>
                  )}
                </div>
              </div>

              <div className="w-full flex flex-col gap-2 hidden">
                {/* Event Statistics */}
                <div className="flex w-full items-center gap-4 text-sm text-[var(--muted-foreground)]">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{event.attendeeCount} attending</span>
                  </div>
                </div>

                {/* Attendees Preview */}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Attendees:
                    </span>
                    <div className="flex -space-x-2">
                      {event.attendees
                        .filter((attendee) => attendee.status === "attending")
                        .slice(0, 5)
                        .map((attendee, index) => (
                          <div
                            key={attendee.user._id || index}
                            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-2 border-[var(--background)] flex items-center justify-center text-white text-xs font-medium"
                            title={`${attendee.user.name} (${attendee.status})`}
                          >
                            {attendee.user.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        ))}
                      {event.attendeeCount > 5 && (
                        <div className="w-8 h-8 bg-[var(--muted)] border-2 border-[var(--background)] rounded-full flex items-center justify-center text-[var(--muted-foreground)] text-xs font-medium">
                          +{event.attendeeCount - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RSVP Section */}
          <div className=" border-t border-[var(--border)] pt-2 mt-2 w-full">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Your Attendance
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleRSVP("attending")}
                disabled={rsvpLoading}
                className={`flex items-center px-4 py-2 rounded-md border transition-all duration-200 ${
                  event.userRSVPStatus === "attending"
                    ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                    : "bg-[var(--muted)] hover:bg-green-50 hover:border-green-300 hover:text-green-700 border-[var(--border)] text-[var(--foreground)]"
                } ${rsvpLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Check className="h-4 w-4 mr-2" />
                Going
                {event.userRSVPStatus === "attending" && " ✓"}
              </button>

              <button
                onClick={() => handleRSVP("maybe")}
                disabled={rsvpLoading}
                className={`flex items-center px-4 py-2 rounded-md border transition-all duration-200 ${
                  event.userRSVPStatus === "maybe"
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600"
                    : "bg-[var(--muted)] hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-700 border-[var(--border)] text-[var(--foreground)]"
                } ${rsvpLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Maybe
                {event.userRSVPStatus === "maybe" && " ✓"}
              </button>

              <button
                onClick={() => handleRSVP("not_attending")}
                disabled={rsvpLoading}
                className={`flex items-center px-4 py-2 rounded-md border transition-all duration-200 ${
                  event.userRSVPStatus === "not_attending"
                    ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                    : "bg-[var(--muted)] hover:bg-red-50 hover:border-red-300 hover:text-red-700 border-[var(--border)] text-[var(--foreground)]"
                } ${rsvpLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <X className="h-4 w-4 mr-2" />
                Can&apos;t Go
                {event.userRSVPStatus === "not_attending" && " ✓"}
              </button>
            </div>

            {rsvpLoading && (
              <p className="text-sm text-[var(--muted-foreground)] mt-2">
                Updating attendance...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isLoading && setIsDeleteModalOpen(false)}
        title="Delete Event"
        size="md"
      >
        <div className="space-y-4 p-4">
          <p className="text-[var(--muted-foreground)]">
            Are you sure you want to delete &quot;{event.name}&quot;? This
            action cannot be undone. All event data, RSVPs, and associated
            information will be permanently lost.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isLoading}
              className="px-4 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteEvent}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Deleting..." : "Delete Event"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Event Modal */}
      <EditEventModal
        key={`edit-${event.id}-${isEditModalOpen}`}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEventUpdate}
        isLoading={isLoading}
        event={event}
      />
    </>
  );
}
