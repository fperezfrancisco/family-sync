"use client";

import React from "react";
import { Calendar, Clock, MapPin, Users, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Event } from "@/types/events";

interface UpcomingEventsCardProps {
  events: Event[];
  onCreateEvent: () => void;
}

/**
 * UpcomingEventsCard Component
 * Displays a preview of upcoming events in the dashboard
 */
export default function UpcomingEventsCard({
  events,
  onCreateEvent,
}: UpcomingEventsCardProps) {
  const router = useRouter();

  // Filter and sort upcoming events (next 5 events)
  const now = new Date();
  const upcomingEvents = events
    .filter((event) => new Date(event.startDate) > now)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .slice(0, 5);

  /**
   * Format date for display
   */
  const formatEventDate = (dateString: string, isAllDay?: boolean) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if it's today or tomorrow
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const isThisWeek =
      date.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000;

    let dateStr = "";
    if (isToday) {
      dateStr = "Today";
    } else if (isTomorrow) {
      dateStr = "Tomorrow";
    } else if (isThisWeek) {
      dateStr = date.toLocaleDateString("en-US", { weekday: "long" });
    } else {
      dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    // Add time if not all day
    if (!isAllDay) {
      const timeStr = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return `${dateStr} at ${timeStr}`;
    }

    return dateStr;
  };

  /**
   * Handle event click - navigate to event details
   */
  const handleEventClick = (eventId: string) => {
    router.push(`dashboard/events/${eventId}`);
  };

  /**
   * Handle view all events
   */
  const handleViewAllEvents = () => {
    router.push("dashboard/events");
  };

  if (upcomingEvents.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 font-inter">
          Upcoming Events
        </h3>
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-inter mb-3">
            No upcoming events scheduled
          </p>
          <button
            onClick={onCreateEvent}
            className="text-sm text-primary hover:text-primary/80 font-medium font-inter"
          >
            Create your first event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground font-inter">
          Upcoming Events
        </h3>
        <button
          onClick={handleViewAllEvents}
          className="text-sm text-primary hover:text-primary/80 font-medium font-inter flex items-center gap-1"
        >
          View all
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-3">
        {upcomingEvents.map((event) => (
          <div
            key={event.id}
            onClick={() => handleEventClick(event.id)}
            className="p-3 rounded-lg border border-border hover:border-primary/20 hover:bg-accent/50 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate font-inter">
                  {event.name}
                </h4>

                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {formatEventDate(event.startDate, event.isAllDay)}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  {/* Location */}
                  {(event.location || event.isVirtual) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {event.isVirtual ? "Virtual" : event.location}
                      </span>
                    </div>
                  )}

                  {/* Group */}
                  {event.group && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3 shrink-0" />
                      <span className="truncate">{event.group.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Event type indicator */}
              <div className="shrink-0">
                {event.isAllDay && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 font-inter">
                    All Day
                  </span>
                )}
                {event.isVirtual && !event.isAllDay && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 font-inter">
                    Virtual
                  </span>
                )}
                {event.isPrivate && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 font-inter ml-1">
                    Private
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick action to create event */}
      <button
        onClick={onCreateEvent}
        className="w-full mt-4 p-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors font-inter"
      >
        + Create new event
      </button>
    </div>
  );
}
