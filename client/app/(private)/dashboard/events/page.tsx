"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { EventGrid, EventFilters, CreateEventModal } from "@/components/events";
import { Event, CreateEventData } from "@/types/events";
import { useEvents } from "@/context/EventsContext";
import { useGroups } from "@/context/GroupsContext";
import { Group } from "@/types";

// Dummy data for demonstration
const dummyGroups = [
  { id: "1", name: "Smith Family", type: "family" as const },
  { id: "2", name: "Weekend Warriors", type: "friends" as const },
  { id: "3", name: "Work Team", type: "work" as const },
];

const dummyEvents: Event[] = [
  {
    id: "1",
    name: "Family BBQ",
    description: "Annual summer barbecue at the park with games and good food!",
    startDate: "2024-07-20T16:00:00Z",
    endDate: "2024-07-20T20:00:00Z",
    isAllDay: false,
    timezone: "UTC",
    location: "Central Park, Pavilion A",
    isVirtual: false,
    owner: { id: "user1", name: "John Smith", email: "john@example.com" },
    group: { id: "1", name: "Smith Family", type: "family" },
    isPrivate: false,
    allowGuestInvites: true,
    requireRSVP: true,
    maxAttendees: 25,
    attendees: [
      {
        user: {
          id: "user1",
          name: "John Smith",
          email: "john@example.com",
          groups: [],
        },
        status: "attending",
        invitedAt: "2024-07-01T10:00:00Z",
        respondedAt: "2024-07-01T10:00:00Z",
      },
      {
        user: {
          id: "user2",
          name: "Jane Smith",
          email: "jane@example.com",
          groups: [],
        },
        status: "attending",
        invitedAt: "2024-07-01T10:00:00Z",
        respondedAt: "2024-07-02T14:30:00Z",
      },
      {
        user: {
          id: "user3",
          name: "Mike Smith",
          email: "mike@example.com",
          groups: [],
        },
        status: "maybe",
        invitedAt: "2024-07-01T10:00:00Z",
        respondedAt: "2024-07-03T09:15:00Z",
      },
    ],
    status: "published",
    attendeeCount: 2,
    pendingInvites: 3,
    userRSVPStatus: "attending",
    canEdit: true,
    canDelete: true,
    createdAt: "2024-07-01T10:00:00Z",
    updatedAt: "2024-07-01T10:00:00Z",
  },
  {
    id: "2",
    name: "Team Building Workshop",
    description:
      "Monthly team building activity to improve collaboration and communication.",
    startDate: "2024-07-25T09:00:00Z",
    endDate: "2024-07-25T17:00:00Z",
    isAllDay: false,
    timezone: "UTC",
    location: "Conference Room B",
    isVirtual: false,
    owner: { id: "user4", name: "Sarah Wilson", email: "sarah@company.com" },
    group: { id: "3", name: "Work Team", type: "work" },
    isPrivate: false,
    allowGuestInvites: false,
    requireRSVP: true,
    attendees: [
      {
        user: {
          id: "user1",
          name: "John Smith",
          email: "john@example.com",
          groups: [],
        },
        status: "pending",
        invitedAt: "2024-07-10T08:00:00Z",
      },
    ],
    status: "published",
    attendeeCount: 8,
    pendingInvites: 2,
    userRSVPStatus: "pending",
    canEdit: false,
    canDelete: false,
    createdAt: "2024-07-10T08:00:00Z",
    updatedAt: "2024-07-10T08:00:00Z",
  },
  {
    id: "3",
    name: "Movie Night",
    description:
      "Virtual movie night - we'll watch the latest blockbuster together!",
    startDate: "2024-07-15T19:00:00Z",
    endDate: "2024-07-15T22:00:00Z",
    isAllDay: false,
    timezone: "UTC",
    isVirtual: true,
    locationUrl: "https://zoom.us/j/123456789",
    owner: { id: "user5", name: "Alex Johnson", email: "alex@example.com" },
    group: { id: "2", name: "Weekend Warriors", type: "friends" },
    isPrivate: false,
    allowGuestInvites: true,
    requireRSVP: true,
    maxAttendees: 10,
    attendees: [
      {
        user: {
          id: "user1",
          name: "John Smith",
          email: "john@example.com",
          groups: [],
        },
        status: "attending",
        invitedAt: "2024-07-05T12:00:00Z",
        respondedAt: "2024-07-05T18:30:00Z",
      },
    ],
    status: "published",
    attendeeCount: 6,
    pendingInvites: 1,
    userRSVPStatus: "attending",
    canEdit: false,
    canDelete: false,
    createdAt: "2024-07-05T12:00:00Z",
    updatedAt: "2024-07-05T12:00:00Z",
  },
  {
    id: "4",
    name: "Birthday Celebration",
    description: "Celebrating Emma's 25th birthday with cake and surprises!",
    startDate: "2024-08-10T14:00:00Z",
    isAllDay: true,
    timezone: "UTC",
    location: "Emma's House",
    isVirtual: false,
    owner: { id: "user1", name: "John Smith", email: "john@example.com" },
    isPrivate: false,
    allowGuestInvites: true,
    requireRSVP: true,
    attendees: [
      {
        user: {
          id: "user1",
          name: "John Smith",
          email: "john@example.com",
          groups: [],
        },
        status: "attending",
        invitedAt: "2024-07-15T10:00:00Z",
        respondedAt: "2024-07-15T10:00:00Z",
      },
    ],
    status: "draft",
    attendeeCount: 1,
    userRSVPStatus: "attending",
    canEdit: true,
    canDelete: true,
    createdAt: "2024-07-15T10:00:00Z",
    updatedAt: "2024-07-16T15:30:00Z",
  },
];

/**
 * Events Page
 * Shows user's events with filtering and management functionality
 */
export default function EventsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  //const [events, setEvents] = useState<Event[]>(dummyEvents);
  const [displayEvents, setDisplayEvents] = useState<Event[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [filters, setFilters] = useState({});
  const { groups } = useGroups();
  const { events, createEvent } = useEvents();

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
      // TODO: Replace with actual API call
      console.log("RSVP update:", eventId, status);

      alert(`RSVP updated to ${status}`);
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
  const handleDeleteEvent = (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      alert("Event deleted successfully!");
    }
  };

  /**
   * Handle event details view
   */
  const handleViewDetails = (eventId: string) => {
    console.log("View event details:", eventId);
    // TODO: Navigate to event details page
    alert("Event details page will be implemented soon!");
  };

  /**
   * Filter events based on current filters
   */
  const filteredEvents = displayEvents.filter(() => {
    // Add filtering logic here based on filters state
    // For now, return all events
    return true;
  });

  useEffect(() => {
    if (events) {
      setDisplayEvents(events);
    }
  }, [events]);

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
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors font-inter"
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
        events={filteredEvents}
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
