"use client";

import React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { Event } from "@/types/events";

interface EventCardProps {
  event: Event;
  onRSVP?: (
    eventId: string,
    status: "attending" | "not_attending" | "maybe"
  ) => void;
  onEdit?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
  onViewDetails?: (eventId: string) => void;
}

/**
 * EventCard Component
 * Displays individual event information in a card format
 */
export default function EventCard({
  event,
  onRSVP,
  onEdit,
  onDelete,
  onViewDetails,
}: EventCardProps) {
  /**
   * Helper function to create timezone-adjusted dates
   */
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

  /**
   * Format date for display with timezone handling
   */
  const formatEventDate = (
    startDate: string,
    endDate?: string,
    isAllDay?: boolean
  ) => {
    const start = createTimezoneAdjustedDate(startDate, isAllDay);
    const end = endDate ? createTimezoneAdjustedDate(endDate, isAllDay) : null;

    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };

    if (!isAllDay) {
      options.hour = "numeric";
      options.minute = "2-digit";
    }

    const startFormatted = start.toLocaleDateString("en-US", options);

    if (end && !isSameDay(start, end)) {
      const endFormatted = end.toLocaleDateString("en-US", options);
      return `${startFormatted} - ${endFormatted}`;
    } else if (end && !isAllDay) {
      const endTime = end.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      return `${startFormatted} - ${endTime}`;
    }

    return startFormatted;
  };

  /**
   * Check if two dates are on the same day
   */
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  /**
   * Get group type styling
   */
  const getGroupTypeStyle = (type?: string) => {
    switch (type) {
      case "family":
        return {
          bg: "bg-green-50 dark:bg-green-950/30",
          border: "border-green-200 dark:border-green-800",
          text: "text-green-700 dark:text-green-300",
        };
      case "friends":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/30",
          border: "border-blue-200 dark:border-blue-800",
          text: "text-blue-700 dark:text-blue-300",
        };
      case "work":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/30",
          border: "border-purple-200 dark:border-purple-800",
          text: "text-purple-700 dark:text-purple-300",
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-950/30",
          border: "border-gray-200 dark:border-gray-800",
          text: "text-gray-700 dark:text-gray-300",
        };
    }
  };

  /**
   * Get RSVP status styling
   */
  const getRSVPStatusStyle = (status?: string) => {
    switch (status) {
      case "attending":
        return {
          icon: CheckCircle,
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-50 dark:bg-green-950/30",
          text: "Attending",
        };
      case "not_attending":
        return {
          icon: XCircle,
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-950/30",
          text: "Not Attending",
        };
      case "maybe":
        return {
          icon: AlertCircle,
          color: "text-yellow-600 dark:text-yellow-400",
          bg: "bg-yellow-50 dark:bg-yellow-950/30",
          text: "Maybe",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-gray-500 dark:text-gray-400",
          bg: "bg-gray-50 dark:bg-gray-950/30",
          text: "Pending",
        };
    }
  };

  /**
   * Get event status styling
   */
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const groupStyle = event.group ? getGroupTypeStyle(event.group.type) : null;
  const rsvpStatus = getRSVPStatusStyle(event.userRSVPStatus || undefined);
  const RSVPIcon = rsvpStatus.icon;

  return (
    <div className="group bg-[var(--card)] border border-[var(--border)] rounded-lg hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3
                className="font-semibold text-[var(--foreground)] font-inter text-lg leading-tight cursor-pointer hover:text-[var(--primary)] transition-colors"
                onClick={() => onViewDetails?.(event.id)}
              >
                {event.name}
              </h3>

              {/* Event Status Badge */}
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusStyle(
                  event.status
                )}`}
              >
                {event.status}
              </span>
            </div>

            {/* Group Badge */}
            {event.group && event.group.id && groupStyle && (
              <div
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${groupStyle.bg} ${groupStyle.text}`}
              >
                {event.group.name}
              </div>
            )}

            {/* Event Description */}
            {event.description && (
              <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3">
                {event.description || "No description provided."}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          {(event.canEdit || event.canDelete) && (
            <div className="relative">
              <button className="p-2 rounded-md hover:bg-[var(--muted)] transition-colors opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4 text-[var(--muted-foreground)]" />
              </button>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          {/* Date and Time */}
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Calendar className="h-4 w-4" />
            <span>
              {formatEventDate(event.startDate, event.endDate, event.isAllDay)}
            </span>
            {event.isAllDay && (
              <span className="px-2 py-1 bg-[var(--muted)] text-white dark:text-[var(--muted-foreground)] rounded text-xs font-medium">
                All Day
              </span>
            )}
          </div>

          {/* Location */}
          {(event.location || event.isVirtual) && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              {event.isVirtual ? (
                <>
                  <Video className="h-4 w-4" />
                  <span>Virtual Event</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{event.location}</span>
                </>
              )}
            </div>
          )}

          {/* Attendees */}
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Users className="h-4 w-4" />
            <span>
              {event.attendeeCount} attending
              {event.maxAttendees && ` / ${event.maxAttendees} max`}
            </span>
            {event.pendingInvites && event.pendingInvites > 0 && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                • {event.pendingInvites} pending
              </span>
            )}
          </div>
        </div>

        {/* RSVP Status & Actions */}
        {event.requireRSVP && (
          <div className="flex gap-2 flex-wrap items-center justify-between pt-3 border-t border-[var(--border)]">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full ${rsvpStatus.bg}`}
            >
              <RSVPIcon className={`h-4 w-4 ${rsvpStatus.color}`} />
              <span className={`text-sm font-medium ${rsvpStatus.color}`}>
                {rsvpStatus.text}
              </span>
            </div>

            {/* RSVP Buttons */}
            {event.status === "published" && onRSVP && (
              <div className="flex gap-1">
                <button
                  onClick={() => onRSVP(event.id, "attending")}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    event.userRSVPStatus === "attending"
                      ? "bg-green-600 text-white"
                      : "bg-[var(--muted)] hover:bg-green-50 dark:hover:bg-green-950/30 text-white dark:text-[var(--muted-foreground)] hover:text-green-600"
                  }`}
                >
                  Going
                </button>
                <button
                  onClick={() => onRSVP(event.id, "maybe")}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    event.userRSVPStatus === "maybe"
                      ? "bg-yellow-600 text-white"
                      : "bg-[var(--muted)] hover:bg-yellow-50 dark:hover:bg-yellow-950/30 text-white dark:text-[var(--muted-foreground)] hover:text-yellow-600"
                  }`}
                >
                  Maybe
                </button>
                <button
                  onClick={() => onRSVP(event.id, "not_attending")}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    event.userRSVPStatus === "not_attending"
                      ? "bg-red-600 text-white"
                      : "bg-[var(--muted)] hover:bg-red-50 dark:hover:bg-red-950/30 text-white dark:text-[var(--muted-foreground)] hover:text-red-600"
                  }`}
                >
                  Can&apos;t Go
                </button>
              </div>
            )}
          </div>
        )}

        {/* Event Management Actions */}
        {(event.canEdit || event.canDelete) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            {event.canEdit && (
              <button
                onClick={() => onEdit?.(event.id)}
                className="flex items-center px-3 py-1 text-sm bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </button>
            )}
            {event.canDelete && (
              <button
                onClick={() => onDelete?.(event.id)}
                className="flex items-center px-3 py-1 text-sm bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
