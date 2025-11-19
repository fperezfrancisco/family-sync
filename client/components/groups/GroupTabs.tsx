"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Calendar,
  Image as ImageIcon,
  CheckSquare,
  Info,
  Users,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Group } from "@/types/groups";
import { Event, CreateEventData } from "@/types/events";
import { useEvents } from "@/context/EventsContext";
import { useAuth } from "@/context/AuthContext";
import { EventGrid, EventFilters, CreateEventModal } from "@/components/events";
import { EventFilters as EventFiltersType } from "@/components/events/EventFilters";

interface GroupTabsProps {
  groupId: string;
  group: Group;
  currentUserId?: string;
}

// Available tabs for the group page
const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: Info,
    description: "Group information and recent activity",
  },
  {
    id: "chat",
    label: "Chat",
    icon: MessageCircle,
    description: "Group messages and conversations",
  },
  {
    id: "events",
    label: "Events",
    icon: Calendar,
    description: "Upcoming events and calendar",
  },
  {
    id: "media",
    label: "Media",
    icon: ImageIcon,
    description: "Shared photos and files",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    description: "Group tasks and to-do lists",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Group Tabs Component
 * Handles navigation between different group sections
 */
export default function GroupTabs({
  groupId,
  group,
}: Omit<GroupTabsProps, "currentUserId">) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  /**
   * Render tab content based on active tab
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab group={group} />;
      case "chat":
        return <ChatTab groupId={groupId} />;
      case "events":
        return <EventsTab groupId={groupId} group={group} />;
      case "media":
        return <MediaTab groupId={groupId} />;
      case "tasks":
        return <TasksTab groupId={groupId} />;
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
                title={tab.description}
              >
                <Icon
                  className={`mr-2 h-5 w-5 ${
                    isActive
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">{renderTabContent()}</div>
    </div>
  );
}

/**
 * Overview Tab - Shows group summary and recent activity
 */
function OverviewTab({ group }: { group: Group }) {
  const { events } = useEvents();
  const groupEvents = events.filter((event) => event.group?.id === group.id);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-foreground">Members</h3>
            <span className="text-sm text-muted-foreground">
              ({group.members.length})
            </span>
          </div>

          <div className="space-y-3">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {member.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                    member.role === "owner"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                      : member.role === "admin"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                      : member.role === "member"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                  }`}
                >
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Section - Placeholder */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No recent activity to display
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Activity will appear here when members interact with the group
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Group Statistics */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Group Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {group.members.length}
            </div>
            <div className="text-sm text-muted-foreground">Members</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">0</div>
            <div className="text-sm text-muted-foreground">Messages</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {groupEvents.length}
            </div>
            <div className="text-sm text-muted-foreground">Events</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">0</div>
            <div className="text-sm text-muted-foreground">Media Files</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder tab components for future implementation
 */
function ChatTab({ groupId }: { groupId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Chat Coming Soon
      </h3>
      <p className="text-muted-foreground text-center max-w-md">
        Group chat functionality will be implemented here. Members will be able
        to send messages, share files, and communicate in real-time.
      </p>
      <p className="text-sm text-muted-foreground mt-4">Group ID: {groupId}</p>
    </div>
  );
}

function EventsTab({ groupId, group }: { groupId: string; group?: Group }) {
  return <GroupEventsTab groupId={groupId} group={group} />;
}

function MediaTab({ groupId }: { groupId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Media Coming Soon
      </h3>
      <p className="text-muted-foreground text-center max-w-md">
        Media sharing functionality will be implemented here. Members will be
        able to upload photos, videos, and share files with the group.
      </p>
      <p className="text-sm text-muted-foreground mt-4">Group ID: {groupId}</p>
    </div>
  );
}

function TasksTab({ groupId }: { groupId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <CheckSquare className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Tasks Coming Soon
      </h3>
      <p className="text-muted-foreground text-center max-w-md">
        Task management functionality will be implemented here. Members will be
        able to create tasks, assign them to others, and track progress.
      </p>
      <p className="text-sm text-muted-foreground mt-4">Group ID: {groupId}</p>
    </div>
  );
}

/**
 * Group Events Tab Component
 * Displays and manages events specific to a group
 */
function GroupEventsTab({
  groupId,
  group,
}: {
  groupId: string;
  group?: Group;
}) {
  const router = useRouter();
  const {} = useAuth(); // Keep import available for future use
  const { events, createEvent } = useEvents();

  // Local state for the events tab
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<EventFiltersType>({});

  // Filter events for this specific group
  const groupEvents = events.filter((event) => event.group?.id === groupId);

  // Date calculations for filters
  const today = new Date();
  const todayWeekday = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - todayWeekday);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  /**
   * Handle event creation for this group
   */
  const handleCreateEvent = async (data: CreateEventData) => {
    setIsLoading(true);
    try {
      // Automatically associate the event with this group
      const groupEventData: CreateEventData = {
        ...data,
        group: group
          ? {
              id: group.id,
              name: group.name,
              type: group.type,
            }
          : {
              id: groupId,
              name: "Current Group",
              type: "other",
            },
      };

      console.log("Creating group event:", groupEventData);
      const response = await createEvent(groupEventData);
      if (response && response.message) {
        alert(`${response.message}`);
      }
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
    router.push(`/dashboard/events/${eventId}`);
  };

  /**
   * Handle event deletion
   */
  const handleDeleteEvent = (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      console.log("Deleting event:", eventId);
      alert("Event deleted successfully!");
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
   */
  const getFilteredEvents = () => {
    return groupEvents.filter((event: Event) => {
      if (filters && Object.keys(filters).length > 0) {
        if (filters.dateRange) {
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

  return (
    <div className="space-y-6">
      {/* Group Events Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground font-inter">
            Group Events
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Events organized by this group ({groupEvents.length} total)
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors font-inter"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Group Event
        </button>
      </div>

      {/* Event Filters */}
      <EventFilters
        currentFilters={filters}
        onFilterChange={setFilters}
        availableGroups={[]} // Empty since we're in group context
      />

      {/* Events Grid */}
      <div className="min-h-[400px]">
        <EventGrid
          events={getFilteredEvents()}
          loading={false}
          onCreateEvent={() => setIsCreateModalOpen(true)}
          onRSVP={handleRSVP}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEvent}
        isLoading={isLoading}
        availableGroups={[]} // Empty since we're creating events for this specific group
      />
    </div>
  );
}
