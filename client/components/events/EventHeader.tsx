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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Event } from "@/types/events";
import Modal from "@/components/ui/Modal";
import { useEvents } from "@/context/EventsContext";

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
}: EventHeaderProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { deleteEvent } = useEvents();

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

  // Format date and time
  const formatEventDate = (
    startDate: string,
    endDate?: string,
    isAllDay?: boolean
  ) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };

    if (isAllDay) {
      if (end && start.toDateString() !== end.toDateString()) {
        return `${start.toLocaleDateString(
          "en-US",
          dateOptions
        )} - ${end.toLocaleDateString("en-US", dateOptions)}`;
      }
      return start.toLocaleDateString("en-US", dateOptions);
    }

    const startStr = `${start.toLocaleDateString(
      "en-US",
      dateOptions
    )} at ${start.toLocaleTimeString("en-US", timeOptions)}`;

    if (end) {
      if (start.toDateString() === end.toDateString()) {
        return `${startStr} - ${end.toLocaleTimeString("en-US", timeOptions)}`;
      } else {
        return `${startStr} - ${end.toLocaleDateString(
          "en-US",
          dateOptions
        )} at ${end.toLocaleTimeString("en-US", timeOptions)}`;
      }
    }

    return startStr;
  };

  // Handle edit event
  const handleEditEvent = () => {
    // TODO: Implement edit functionality
    console.log("Edit event:", event.id);
    setIsEditModalOpen(true);
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

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        {/* Navigation and Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </button>

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

        {/* Event Information */}
        <div className="space-y-4">
          {/* Title and Status */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground font-inter">
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

              {/* User's RSVP Status Badge */}
              {event.userRSVPStatus && (
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full capitalize ${getRSVPStatusColor(
                    event.userRSVPStatus
                  )}`}
                >
                  Your RSVP:{" "}
                  {event.userRSVPStatus === "not_attending"
                    ? "Not Attending"
                    : event.userRSVPStatus}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-muted-foreground text-lg leading-relaxed">
              {event.description}
            </p>
          )}

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            {/* Date and Time */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {formatEventDate(
                    event.startDate,
                    event.endDate,
                    event.isAllDay
                  )}
                </p>
                {event.isAllDay && (
                  <p className="text-xs text-muted-foreground">All day event</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              {event.isVirtual ? (
                <Globe className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-foreground">
                  {event.isVirtual ? "Virtual Event" : "Location"}
                </p>
                <p className="text-sm text-muted-foreground">
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

            {/* Organizer */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Organizer</p>
                <p className="text-sm text-muted-foreground">
                  {event.owner?.name || "Unknown Organizer"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {event.owner?.email || "No email provided"}
                </p>
              </div>
            </div>

            {/* Group Association */}
            {event.group && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Group Event</p>
                  <p className="text-sm text-muted-foreground">
                    {event.group.name}
                  </p>
                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded capitalize">
                    {event.group.type}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Event Statistics */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{event.attendeeCount} attending</span>
            </div>
            {event.pendingInvites && event.pendingInvites > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{event.pendingInvites} pending invites</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Created {new Date(event.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Attendees Preview */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">
                Attendees:
              </span>
              <div className="flex -space-x-2">
                {event.attendees
                  .filter((attendee, index) => attendee.status === "attending")
                  .slice(0, 5)
                  .map((attendee, index) => (
                    <div
                      key={attendee.user.id || index}
                      className="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-medium"
                      title={`${attendee.user.name} (${attendee.status})`}
                    >
                      {attendee.user.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  ))}
                {event.attendeeCount > 5 && (
                  <div className="w-8 h-8 bg-muted border-2 border-background rounded-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                    +{event.attendeeCount - 5}
                  </div>
                )}
              </div>
            </div>
          )}
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
          <p className="text-muted-foreground">
            Are you sure you want to delete &quot;{event.name}&quot;? This
            action cannot be undone. All event data, RSVPs, and associated
            information will be permanently lost.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isLoading}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
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

      {/* Edit Event Modal - Placeholder for now */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Event"
        size="lg"
      >
        <div className="space-y-4 p-4">
          <p className="text-muted-foreground">
            Edit event functionality will be implemented here.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
