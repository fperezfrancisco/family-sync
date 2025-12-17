"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  MessageCircle,
  Calendar,
  Image as ImageIcon,
  CheckSquare,
  Info,
  Users,
  Plus,
  Send,
  Bell,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Group } from "@/types/groups";
import { Event, CreateEventData } from "@/types/events";
import {
  CreateTaskData,
  TaskStatus,
  TaskFilters as TaskFiltersType,
} from "@/types/tasks";
import { useEvents } from "@/context/EventsContext";
import { useTasks } from "@/context/TasksContext";
import { useAuth } from "@/context/AuthContext";
import { useGroups } from "@/context/GroupsContext";
import { useChat, ChatMessage } from "@/hooks/socket";
import { useGroupRecentActivity } from "@/hooks/useGroupRecentActivity";
import { RecentActivity } from "@/hooks/useRecentActivity";
import { EventGrid, EventFilters, CreateEventModal } from "@/components/events";
import { TaskGrid, TaskFilters, CreateTaskModal } from "@/components/tasks";
import { EventFilters as EventFiltersType } from "@/components/events/EventFilters";
import GroupRecentActivityModal from "./GroupRecentActivityModal";

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
    id: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    description: "Group tasks and to-do lists",
  },
  {
    id: "media",
    label: "Media",
    icon: ImageIcon,
    description: "Shared photos and files",
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

  // Get accent color from group customization
  const accentColor = group.customization?.accentColor?.hex || null;

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
      case "tasks":
        return <TasksTab groupId={groupId} />;
      case "media":
        return <MediaTab groupId={groupId} />;
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
            const tabColor = accentColor || "var(--primary)";

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "text-foreground dark:text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
                style={
                  isActive
                    ? {
                        borderBottomColor: tabColor,
                        color: tabColor,
                      }
                    : undefined
                }
                title={tab.description}
              >
                <Icon
                  className={`mr-2 h-5 w-5 transition-colors`}
                  style={
                    isActive
                      ? {
                          color: tabColor,
                        }
                      : undefined
                  }
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
  const router = useRouter();
  const [isRecentActivityModalOpen, setIsRecentActivityModalOpen] =
    useState(false);

  const groupEvents = events.filter((event) => event.group?.id === group.id);
  const groupTasks = tasks.filter((task) => task.group?.id === group.id);
  const groupRecentActivity = useGroupRecentActivity({
    groupId: group.id,
    limit: 10,
  });

  // Get accent color from group customization
  const accentColor = group.customization?.accentColor?.hex || null;

  // Navigation handler for activity items
  const handleActivityNavigation = React.useCallback(
    (activity: RecentActivity) => {
      // For messages, we need to navigate to chat and optionally select the group
      if (activity.type === "message" && activity.navigationData?.groupId) {
        // Navigate to chat with group selection
        const chatPath = `/dashboard/chat?groupId=${activity.navigationData.groupId}`;
        router.push(chatPath);
      } else {
        // For tasks, events, and groups, navigate directly to the path
        router.push(activity.navigationPath);
      }
    },
    [router]
  );
  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members Section */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users
              className="h-5 w-5"
              style={{
                color: accentColor || "var(--primary)",
              }}
            />
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
                  {member.avatar?.small ? (
                    <Image
                      key={`member-avatar-${member.id}-${member.avatar.small}`}
                      src={member.avatar.small}
                      alt={member.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{
                        backgroundColor: accentColor || "#3b82f6",
                      }}
                    >
                      {member.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
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

        {/* Recent Activity Section */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Recent Activity
            </h3>
            <Bell className="h-5 w-5 text-[var(--muted-foreground)]" />
          </div>

          <div className="space-y-4">
            {groupRecentActivity.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-3" />
                <p className="text-sm text-[var(--muted-foreground)]">
                  No recent activity to display
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  Activity will appear here when members interact with the group
                </p>
              </div>
            ) : (
              <>
                {groupRecentActivity.slice(0, 3).map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => handleActivityNavigation(activity)}
                    className="flex items-start space-x-3 py-2 rounded-md hover:bg-[var(--accent)] transition-colors duration-150 cursor-pointer"
                  >
                    <div
                      className={`size-12 rounded-full shrink-0
                      ${activity.type === "event" ? "bg-blue-100" : ""}
                      ${activity.type === "task" ? "bg-green-100" : ""}
                      ${activity.type === "message" ? "bg-purple-100" : ""}
                      `}
                    >
                      {activity.type === "event" && (
                        <Calendar className="h-6 w-6 text-blue-600 m-3" />
                      )}
                      {activity.type === "task" && (
                        <CheckSquare className="h-6 w-6 text-green-600 m-3" />
                      )}
                      {activity.type === "message" && (
                        <MessageCircle className="h-6 w-6 text-purple-600 m-3" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm font-medium text-[var(--foreground)] font-inter">
                        {activity.message}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1 font-inter">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}

                {groupRecentActivity.length > 3 && (
                  <button
                    onClick={() => setIsRecentActivityModalOpen(true)}
                    className="w-full mt-4 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium font-inter"
                  >
                    View all activity
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Group Statistics */}
      <div className="bg-card border border-[var(--border)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Group Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-(--muted)/10 dark:bg-[var(--muted)]/50 rounded-lg">
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {group.members.length}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Members
            </div>
          </div>
          <div className="text-center p-4 bg-(--muted)/10 dark:bg-[var(--muted)]/50 rounded-lg">
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {groupTasks.length}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">Tasks</div>
          </div>
          <div className="text-center p-4 bg-(--muted)/10 dark:bg-[var(--muted)]/50 rounded-lg">
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {groupEvents.length}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">Events</div>
          </div>
          <div className="text-center p-4 bg-(--muted)/10 dark:bg-[var(--muted)]/50 rounded-lg">
            <div className="text-2xl font-bold text-[var(--foreground)]">0</div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Media Files
            </div>
          </div>
        </div>
      </div>

      {/* Group Recent Activity Modal */}
      <GroupRecentActivityModal
        isOpen={isRecentActivityModalOpen}
        onClose={() => setIsRecentActivityModalOpen(false)}
        groupId={group.id}
        groupName={group.name}
      />
    </div>
  );
}

/**
 * Group Chat Tab Component
 * Provides dedicated chat interface for the current group
 */
function ChatTab({ groupId }: { groupId: string }) {
  return <GroupChatTab groupId={groupId} />;
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
  const { events, createEvent, rsvpToEvent } = useEvents();

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
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:items-center justify-between">
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
  const { groups } = useGroups();

  // Local state for the tasks tab
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFiltersType>({});

  // Filter tasks for this specific group
  const groupTasks = tasks.filter((task) => task.group?.id === groupId);

  // Get current group information
  const currentGroup = groups.find((group: Group) => group.id === groupId);
  console.log("Current group: ", currentGroup);

  /**
   * Handle task creation for this group
   */
  const handleCreateTask = async (data: CreateTaskData) => {
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
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:items-center justify-between">
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
        defaultGroupId={groupId}
        availableGroups={currentGroup ? [currentGroup] : []}
        availableEvents={[]} // TODO: Filter events for this group
      />
    </div>
  );
}

/**
 * Group Chat Tab Component
 * Simplified chat interface specifically for group conversations
 */
function GroupChatTab({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const { groups } = useGroups();
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current group information
  const currentGroup = groups.find((group: Group) => group.id === groupId);

  const {
    messages,
    sendMessage,
    typingUsers,
    onlineUserCount,
    isConnected,
    startTyping,
    stopTyping,
    isTyping,
  } = useChat(groupId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle message sending
  const handleSendMessage = () => {
    if (messageInput.trim() && currentGroup) {
      sendMessage(messageInput.trim());
      setMessageInput("");
      stopTyping();
    }
  };

  // Handle input changes with typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Start typing indicator if not already typing
    if (e.target.value.trim() && !isTyping) {
      startTyping();
    }
  };

  // Handle key presses
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!currentGroup) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[var(--background)] h-[calc(100vh-200px)] md:h-[calc(100vh-160px)] min-h-[500px] md:min-h-[400px] border border-[var(--border)] rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Group Avatar */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>

            {/* Group Info */}
            <div>
              <h3 className="font-semibold text-[var(--foreground)] text-sm">
                {currentGroup.name} Chat
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                {onlineUserCount > 0
                  ? `${onlineUserCount} online`
                  : "No one online"}
              </p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-[var(--muted-foreground)]">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <MessageCircle className="h-16 w-16 text-[var(--muted-foreground)] mb-4 opacity-50" />
            <h4 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Start the conversation
            </h4>
            <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
              Be the first to send a message to {currentGroup.name}. Your
              messages will appear here.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === user?.id;
              const showAvatar =
                index === 0 ||
                messages[index - 1].senderId !== message.senderId;

              return (
                <GroupMessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={isOwnMessage}
                  showAvatar={showAvatar}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 bg-[var(--background)]">
          <div className="flex items-center space-x-2 text-xs text-[var(--muted-foreground)]">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full animate-bounce" />
              <div
                className="w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onBlur={stopTyping}
              placeholder={
                isConnected
                  ? `Message ${currentGroup.name}...`
                  : "Disconnected - reconnecting..."
              }
              disabled={!isConnected}
              className="w-full px-3 py-2 bg-[var(--muted)]/20 dark:bg-(--muted) border border-[var(--border)] rounded-full 
                         text-[var(--foreground)] placeholder-[var(--muted-foreground)] text-sm
                         focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || !isConnected}
            className="p-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full 
                       hover:bg-[var(--primary)]/90 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Group Message Bubble Component
 * Displays individual messages in the group chat
 */
function GroupMessageBubble({
  message,
  isOwnMessage,
  showAvatar,
}: {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar: boolean;
}) {
  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    {
      /**
       * return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
       */
    }
  };

  return (
    <div
      className={`flex items-end space-x-2 ${
        isOwnMessage ? "justify-end" : "justify-start"
      }`}
    >
      {/* Avatar (for other users) */}
      {!isOwnMessage && (
        <div className={`w-6 h-6 ${showAvatar ? "visible" : "invisible"}`}>
          {showAvatar && (
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {message.senderName?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
          isOwnMessage
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "bg-[var(--muted)]/20 text-[var(--foreground)]"
        }`}
      >
        {/* Sender name (for other users) */}
        {!isOwnMessage && showAvatar && (
          <p className="text-xs text-[var(--muted-foreground)] mb-1">
            {message.senderName || "Unknown User"}
          </p>
        )}

        {/* Message content */}
        <p className="text-sm break-words">{message.content}</p>

        {/* Timestamp */}
        <p
          className={`text-xs mt-1 ${
            isOwnMessage
              ? "text-[var(--primary-foreground)]/70"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
