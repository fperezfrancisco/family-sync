"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Event } from "@/types/events";
import { useAuth } from "@/context/AuthContext";
import { EventHeader, EventTabs } from "@/components/events";
import { useEvents } from "@/context/EventsContext";
import { EventsAPI } from "@/lib/api";

/**
 * Individual Event Page
 * Displays detailed view of a specific event with tabs for different functionality
 * Access controlled by event permissions and user's role
 */
export default function EventPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { events } = useEvents();

  /**
   * Fetch event data from API
   * TODO: Replace with actual API call when backend is ready
   */
  const fetchEvent = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Uncomment when API is ready
      const eventData = await EventsAPI.getById(eventId);
      //console.log("event object: ", eventData);
      setEvent(eventData.event);

      // Temporary dummy data for development
      //const foundEvent = events.find((e) => e.id === eventId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId, fetchEvent]);

  /**
   * Handle event updates (edit/delete)
   * Called from EventHeader component
   */
  const handleEventUpdate = () => {
    fetchEvent(); // Refetch event data after updates
  };

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-12 bg-muted rounded-lg"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {error || "Event Not Found"}
        </h2>
        <p className="text-muted-foreground mb-4">
          The event you&apos;re looking for doesn&apos;t exist or you don&apos;t
          have access to it.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-12 bg-muted rounded-lg"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Header with title, details, and action buttons */}
      <EventHeader
        event={event}
        currentUserId={user?.id === null ? undefined : user?.id}
        onEventUpdate={handleEventUpdate}
      />

      {/* Tab Navigation and Content */}
      <EventTabs eventId={eventId} event={event} />
    </div>
  );
}
