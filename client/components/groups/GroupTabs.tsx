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
import {
  Task,
  CreateTaskData,
  TaskStatus,
  TaskFilters as TaskFiltersType,
} from "@/types/tasks";
import { useEvents } from "@/context/EventsContext";
import { useTasks } from "@/context/TasksContext";
import { useAuth } from "@/context/AuthContext";
import { EventGrid, EventFilters, CreateEventModal } from "@/components/events";
import { TaskGrid, TaskFilters, CreateTaskModal } from "@/components/tasks";
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
    <div className="space-y-6 w-full">
      {/* Tab Navigation */}
      <div className="border-b border-[var(--border)]">
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
                    ? "border-[var(--primary)] text-[var(--primary)] dark:text-[var(--primary)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]"
                }`}
                title={tab.description}
              >
                <Icon
                  className={`mr-2 h-5 w-5 ${
                    isActive
                      ? "text-[var(--primary)] dark:text-[var(--primary)]"
                      : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px] h-full">{renderTabContent()}</div>
    </div>
  );
}

/**
 * Overview Tab - Shows group summary and recent activity
 */
function OverviewTab({ group }: { group: Group }) {
  const { events } = useEvents();
  const { tasks } = useTasks();
  const groupEvents = events.filter((event) => event.group?.id === group.id);
  const groupTasks = tasks.filter((task) => task.group?.id === group.id);
  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members Section */}
        <div className="bg-card border border-[var(--border)] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-[var(--primary)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Members
            </h3>
            <span className="text-sm text-[var(--muted-foreground)]">
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
                    <p className="font-medium text-[var(--foreground)]">
                      {member.name}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
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
        <div className="bg-card border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="text-center py-8">
              <p className="text-[var(--muted-foreground)]">
                No recent activity to display
              </p>
              <p className="text-sm text-[var(--muted-foreground)] mt-2">
                Activity will appear here when members interact with the group
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Group Statistics */}
      <div className="bg-card border border-[var(--border)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Group Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-[var(--muted)]/50 rounded-lg">
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {group.members.length}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Members
            </div>
          </div>
          <div className="text-center p-4 bg-[var(--muted)]/50 rounded-lg">
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {groupTasks.length}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">Tasks</div>
          </div>
          <div className="text-center p-4 bg-[var(--muted)]/50 rounded-lg">
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {groupEvents.length}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">Events</div>
          </div>
          <div className="text-center p-4 bg-[var(--muted)]/50 rounded-lg">
            <div className="text-2xl font-bold text-[var(--foreground)]">0</div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Media Files
            </div>
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
  return <GroupTasksTab groupId={groupId} />;
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
          <h2 className="text-xl font-semibold text-[var(--foreground)] font-inter">
            Group Events
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">
            Events organized by this group ({groupEvents.length} total)
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:bg-[var(--primary)]/80 transition-colors font-inter"
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

/**
 * Group Tasks Tab Component
 * Displays and manages tasks specific to a group
 */
function GroupTasksTab({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { tasks, createTask, updateTaskStatus, assignTask } = useTasks();

  // Local state for the tasks tab
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<TaskFiltersType>({});

  // Filter tasks for this specific group
  const groupTasks = tasks.filter((task) => task.group?.id === groupId);

  /**
   * Handle task creation for this group
   */
  const handleCreateTask = async (data: CreateTaskData) => {
    setIsLoading(true);
    try {
      // Automatically associate the task with this group
      const groupTaskData: CreateTaskData = {
        ...data,
        groupId: groupId,
      };

      console.log("Creating group task:", groupTaskData);
      await createTask(groupTaskData);
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle task status update
   */
  const handleTaskStatusUpdate = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, status);
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  /**
   * Handle task view details
   */
  const handleTaskViewDetails = (taskId: string) => {
    router.push(`/dashboard/tasks/${taskId}`);
  };

  /**
   * Handle task claim (self-assignment)
   */
  const handleTaskClaim = async (taskId: string) => {
    if (!user?.id) return;

    try {
      await assignTask(taskId, { assigneeIds: [user.id] });
    } catch (error) {
      console.error("Failed to claim task:", error);
    }
  };

  /**
   * Filter tasks based on current filters
   */
  const getFilteredTasks = () => {
    let filtered = [...groupTasks];

    // Apply filters
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    if (filters.priority && filters.priority !== "all") {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }

    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter((task) => task.category === filters.category);
    }

    if (filters.assignedToMe && user) {
      filtered = filtered.filter((task) =>
        task.assignees.some((assignee) => assignee.id === user.id)
      );
    }

    if (filters.createdByMe && user) {
      filtered = filtered.filter((task) => task.creator.id === user.id);
    }

    if (filters.isOverdue) {
      filtered = filtered.filter((task) => task.isOverdue);
    }

    if (filters.dueDate) {
      const filterDate = new Date(filters.dueDate);
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        const taskDueDate = new Date(task.dueDate);
        return taskDueDate <= filterDate;
      });
    }

    return filtered;
  };

  return (
    <div className="space-y-6">
      {/* Group Tasks Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] font-inter">
            Group Tasks
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">
            Tasks organized by this group ({groupTasks.length} total)
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:bg-[var(--primary)]/80 transition-colors font-inter"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Group Task
        </button>
      </div>

      {/* Task Filters */}
      <TaskFilters
        currentFilters={filters}
        onFilterChange={setFilters}
        availableGroups={[]} // Empty since we're in group context
      />

      {/* Tasks Grid */}
      <div className="min-h-[400px]">
        <TaskGrid
          tasks={getFilteredTasks()}
          isLoading={false}
          error={null}
          onCreateTask={() => setIsCreateModalOpen(true)}
          onTaskStatusUpdate={handleTaskStatusUpdate}
          onTaskViewDetails={handleTaskViewDetails}
          onTaskClaim={handleTaskClaim}
          currentUserId={user?.id || undefined}
          showGroupInfo={false} // Hide group info since we're already in group context
        />
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
        availableGroups={[]} // Will be handled by the modal to use current group
        availableEvents={[]} // TODO: Filter events for this group
        availableUsers={[]} // TODO: Get group members
      />
    </div>
  );
}
