"use client";

import React from "react";
import { Calendar, Plus } from "lucide-react";
import { Event } from "@/types/events";
import EventCard from "./EventCard";

interface EventGridProps {
  events: Event[];
  loading?: boolean;
  onCreateEvent?: () => void;
  onRSVP?: (
    eventId: string,
    status: "attending" | "not_attending" | "maybe"
  ) => void;
  onEdit?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
  onViewDetails?: (eventId: string) => void;
}

/**
 * EventGrid Component
 * Displays events in a responsive grid layout with loading and empty states
 */
/**
 * Loading skeleton component
 */
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
          <div className="h-8 w-8 bg-muted rounded"></div>
        </div>

        {/* Event Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </div>
        </div>

        {/* RSVP Section */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="h-6 bg-muted rounded w-20"></div>
          <div className="flex gap-1">
            <div className="h-6 w-12 bg-muted rounded"></div>
            <div className="h-6 w-12 bg-muted rounded"></div>
            <div className="h-6 w-16 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Empty state component
 */
const EmptyState = ({ onCreateEvent }: { onCreateEvent?: () => void }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
    <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
    <h3 className="text-xl font-semibold text-foreground mb-2 font-inter">
      No Events Found
    </h3>
    <p className="text-muted-foreground mb-6 font-inter max-w-md">
      There are no events matching your current filters. Try adjusting your
      search or create a new event.
    </p>
    {onCreateEvent && (
      <button
        onClick={onCreateEvent}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors font-inter"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Event
      </button>
    )}
  </div>
);

export default function EventGrid({
  events,
  loading = false,
  onCreateEvent,
  onRSVP,
  onEdit,
  onDelete,
  onViewDetails,
}: EventGridProps) {
  /**
   * Render loading skeletons
   */
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingSkeleton key={index} />
        ))}
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (!events || events.length === 0) {
    return (
      <div className="grid grid-cols-1">
        <EmptyState onCreateEvent={onCreateEvent} />
      </div>
    );
  }

  /**
   * Group events by date for better organization
   */
  const groupEventsByDate = (events: Event[]) => {
    const groups: { [key: string]: Event[] } = {};

    events.forEach((event) => {
      const eventDate = new Date(event.startDate);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let groupKey: string;

      if (eventDate.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (eventDate.toDateString() === tomorrow.toDateString()) {
        groupKey = "Tomorrow";
      } else if (eventDate < today) {
        groupKey = "Past Events";
      } else {
        // Future events grouped by month
        groupKey = eventDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(event);
    });

    return groups;
  };

  const eventGroups = groupEventsByDate(events);
  const sortedGroupKeys = Object.keys(eventGroups).sort((a, b) => {
    // Custom sorting to ensure proper order
    const order = ["Today", "Tomorrow", "Past Events"];
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    } else if (aIndex !== -1) {
      return -1;
    } else if (bIndex !== -1) {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  });

  return (
    <div className="space-y-8">
      {sortedGroupKeys.map((groupKey) => (
        <div key={groupKey}>
          {/* Group Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground font-inter">
              {groupKey}
            </h2>
            <span className="text-sm text-muted-foreground">
              {eventGroups[groupKey].length} event
              {eventGroups[groupKey].length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2  gap-6">
            {eventGroups[groupKey].map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onRSVP={onRSVP}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
