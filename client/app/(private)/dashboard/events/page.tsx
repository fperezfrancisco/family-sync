"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { EventGrid, EventFilters, CreateEventModal } from "@/components/events";
import { Event, CreateEventData } from "@/types/events";
import { useEvents } from "@/context/EventsContext";
import { useGroups } from "@/context/GroupsContext";
import { Group } from "@/types";
import { EventFilters as EventFiltersType } from "@/components/events/EventFilters";

/**
 * Events Page
 * Shows user's events with filtering and management functionality
 */
export default function EventsPage() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  //const [events, setEvents] = useState<Event[]>(dummyEvents);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [filters, setFilters] = useState<EventFiltersType>({});
  const { groups } = useGroups();
  const { events, createEvent, deleteEvent, rsvpToEvent } = useEvents();

  // for filters
  const today = new Date();
  const todayWeekday = today.getDay(); // 0 (Sun) to 6 (Sat)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - todayWeekday);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  /**
   * Handle event creation
   */
  const handleCreateEvent = async (data: CreateEventData) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      console.log("Creating event:", data);
      const response = await createEvent(data);
      if (response && response.message) {
        alert(`${response.message}`);
      }
      //alert("Event created successfully!");
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle RSVP updates
   */
  const handleRSVP = async (
    eventId: string,
    status: "attending" | "not_attending" | "maybe"
  ) => {
    try {
      console.log("RSVP update:", eventId, status);
      await rsvpToEvent(eventId, status);
    } catch (error) {
      console.error("Error updating RSVP:", error);
      alert("Failed to update RSVP. Please try again.");
    }
  };

  /**
   * Handle event editing
   */
  const handleEditEvent = (eventId: string) => {
    console.log("Edit event:", eventId);
    // TODO: Open edit modal
    alert("Edit functionality will be implemented soon!");
  };

  /**
   * Handle event deletion
   */
  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        const response = await deleteEvent(eventId);
        if (response && response.message) {
          alert(response.message);
        } else {
          alert("Event deleted successfully!");
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Failed to delete event. Please try again.");
      }
    }
  };

  /**
   * Handle event details view
   */
  const handleViewDetails = (eventId: string) => {
    router.push(`/dashboard/events/${eventId}`);
  };

  /**
   * Filter events based on current filters
   * Returns filtered events directly without local state
   */
  const getFilteredEvents = () => {
    return events.filter((event: Event) => {
      // Add filtering logic here based on filters state
      if (filters && Object.keys(filters).length > 0) {
        // Implement actual filtering logic here
        if (filters.dateRange) {
          // Example: filter by date range
          if (
            filters.dateRange === "today" &&
            event.startDate.split("T")[0] !== today.toISOString().split("T")[0]
          ) {
            return false;
          }
          if (
            filters.dateRange === "week" &&
            (event.startDate.split("T")[0] <
              startOfWeek.toISOString().split("T")[0] ||
              event.startDate.split("T")[0] >
                endOfWeek.toISOString().split("T")[0])
          ) {
            return false;
          }
          if (
            filters.dateRange === "month" &&
            (event.startDate.split("T")[0] <
              startOfMonth.toISOString().split("T")[0] ||
              event.startDate.split("T")[0] >
                endOfMonth.toISOString().split("T")[0])
          ) {
            return false;
          }
          if (filters.dateRange === "custom") {
            if (
              (filters.startDate &&
                filters.startDate.split("T")[0] >
                  event.startDate.split("T")[0]) ||
              (filters.endDate &&
                filters.endDate.split("T")[0] < event.startDate.split("T")[0])
            ) {
              return false;
            }
          }
        }
        if (filters.status) {
          if (filters.status !== event.status) {
            return false;
          }
        }
        if (filters.groupId) {
          if (!event.group || filters.groupId !== event.group?.id) {
            return false;
          }
        }
        if (filters.rsvpStatus) {
          if (
            !event.userRSVPStatus ||
            filters.rsvpStatus !== event.userRSVPStatus
          ) {
            return false;
          }
        }
      }
      return true;
    });
  };

  useEffect(() => {
    if (groups) {
      setAvailableGroups(groups);
    }
  }, [groups]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-inter">
            Events
          </h1>
          <p className="text-muted-foreground mt-2 font-inter">
            Plan and manage events with your groups
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 bg-(--primary) text-white rounded-md hover:bg-(--primary)/80 transition-colors font-inter"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </button>
      </div>

      {/* Event Filters */}
      <EventFilters
        currentFilters={filters}
        onFilterChange={setFilters}
        availableGroups={availableGroups}
      />

      {/* Events Grid */}
      <EventGrid
        events={getFilteredEvents()}
        loading={false}
        onCreateEvent={() => setIsCreateModalOpen(true)}
        onRSVP={handleRSVP}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onViewDetails={handleViewDetails}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEvent}
        isLoading={isLoading}
        availableGroups={availableGroups}
      />
    </div>
  );
}
