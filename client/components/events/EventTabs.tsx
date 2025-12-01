"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Image as ImageIcon,
  CheckSquare,
  Info,
  Users,
  Heart,
  Reply,
  MoreVertical,
  Plus,
} from "lucide-react";
import { Event } from "@/types/events";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/context/TasksContext";
import { useEvents } from "@/context/EventsContext";
import { TaskGrid, TaskFilters, CreateTaskModal } from "@/components/tasks";
import {
  CreateTaskData,
  TaskStatus,
  TaskFilters as TaskFiltersType,
} from "@/types/tasks";
import { useEventComments } from "@/context/EventCommentsContext";
import { EventComment } from "@/types/eventComments";

interface EventTabsProps {
  eventId: string;
  event: Event;
  currentUserId?: string;
}

// Available tabs for the event page
const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: Info,
    description: "Event information and attendees",
  },
  {
    id: "chat",
    label: "Chat",
    icon: MessageCircle,
    description: "Event discussions and messages",
  },
  {
    id: "media",
    label: "Media",
    icon: ImageIcon,
    description: "Event photos and files",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    description: "Event planning tasks and to-do lists",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Event Tabs Component
 * Handles navigation between different event sections
 */
export default function EventTabs({
  eventId,
  event,
}: Omit<EventTabsProps, "currentUserId">) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  /**
   * Render tab content based on active tab
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab event={event} />;
      case "chat":
        return <ChatTab eventId={eventId} />;
      case "media":
        return <MediaTab eventId={eventId} />;
      case "tasks":
        return <TasksTab eventId={eventId} />;
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-[var(--border)]">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id || index}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-gray-300"
                }`}
                title={tab.description}
              >
                <Icon
                  className={`mr-2 h-5 w-5 ${
                    isActive
                      ? "text-blue-500 dark:text-blue-400"
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
      <div className="min-h-[400px]">{renderTabContent()}</div>
    </div>
  );
}

/**
 * Overview Tab - Shows event details and attendee list
 */
function OverviewTab({ event }: { event: Event }) {
  // Get RSVP status styling
  const getRSVPStatusColor = (status: string) => {
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

  // Group attendees by status
  const attendeesByStatus =
    event.attendees?.reduce((acc, attendee) => {
      const status = attendee.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(attendee);
      return acc;
    }, {} as Record<string, typeof event.attendees>) || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendees Section */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Attendees
            </h3>
            <span className="text-sm text-[var(--muted-foreground)]">
              ({event.attendeeCount} attending, {event.attendees?.length || 0}{" "}
              total)
            </span>
          </div>

          {event.attendees && event.attendees.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(attendeesByStatus).map(
                ([status, attendees]) =>
                  attendees &&
                  attendees.length > 0 && (
                    <div key={status}>
                      <h4 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                        {status === "not_attending" ? "Not Attending" : status}{" "}
                        ({attendees.length})
                      </h4>
                      <div className="space-y-2">
                        {attendees.map((attendee, index) => (
                          <div
                            key={attendee.user._id || index}
                            className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                {attendee.user.name?.charAt(0).toUpperCase() ||
                                  "?"}
                              </div>
                              <div>
                                <p className="font-medium text-[var(--foreground)]">
                                  {attendee.user.name}
                                </p>
                                <p className="text-sm text-[var(--muted-foreground)]">
                                  {attendee.user.email}
                                </p>
                                {attendee.respondedAt && (
                                  <p className="text-xs text-[var(--muted-foreground)]">
                                    Responded{" "}
                                    {new Date(
                                      attendee.respondedAt
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getRSVPStatusColor(
                                attendee.status
                              )}`}
                            >
                              {attendee.status === "not_attending"
                                ? "Not Attending"
                                : attendee.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-2" />
              <p className="text-[var(--muted-foreground)]">No attendees yet</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Attendees will appear here when they RSVP
              </p>
            </div>
          )}
        </div>

        {/* Event Details Section */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Event Details
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
                Privacy & Settings
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">
                    Visibility:
                  </span>
                  <span className="text-[var(--foreground)]">
                    {event.isPrivate ? "Private" : "Public"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">
                    RSVP Required:
                  </span>
                  <span className="text-[var(--foreground)]">
                    {event.requireRSVP ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">
                    Guest Invites:
                  </span>
                  <span className="text-[var(--foreground)]">
                    {event.allowGuestInvites ? "Allowed" : "Not Allowed"}
                  </span>
                </div>
                {event.maxAttendees && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Max Attendees:
                    </span>
                    <span className="text-[var(--foreground)]">
                      {event.maxAttendees}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {event.group && (
              <div>
                <h4 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
                  Associated Group
                </h4>
                <div className="p-3 bg-[var(--muted)]/50 rounded-lg">
                  <p className="font-medium text-[var(--foreground)]">
                    {event.group.name}
                  </p>
                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded capitalize">
                    {event.group.type}
                  </span>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
                Timestamps
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">
                    Created:
                  </span>
                  <span className="text-[var(--foreground)]">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">
                    Last Updated:
                  </span>
                  <span className="text-[var(--foreground)]">
                    {new Date(event.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Statistics */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Event Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-[var(--muted)]/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {attendeesByStatus.attending?.length || 0}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Attending
            </div>
          </div>
          <div className="text-center p-4 bg-[var(--muted)]/50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {attendeesByStatus.maybe?.length || 0}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">Maybe</div>
          </div>
          <div className="text-center p-4 bg-[var(--muted)]/50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {attendeesByStatus.not_attending?.length || 0}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Not Attending
            </div>
          </div>
          <div className="text-center p-4 bg-[var(--muted)]/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {attendeesByStatus.pending?.length || 0}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Pending
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Event Comments Tab Component
 * Provides comment thread for event discussion
 */
function ChatTab({ eventId }: { eventId: string }) {
  return <EventCommentsTab eventId={eventId} />;
}

function MediaTab({ eventId }: { eventId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <ImageIcon className="h-16 w-16 text-[var(--muted-foreground)] mb-4" />
      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
        Event Media Coming Soon
      </h3>
      <p className="text-[var(--muted-foreground)] text-center max-w-md">
        Media sharing functionality will be implemented here. Attendees will be
        able to upload photos, videos, and share memories from the event.
      </p>
      <p className="text-sm text-[var(--muted-foreground)] mt-4">
        Event ID: {eventId}
      </p>
    </div>
  );
}

function TasksTab({ eventId }: { eventId: string }) {
  return <EventTasksTab eventId={eventId} />;
}

/**
 * Event Tasks Tab Component
 * Displays and manages tasks specific to an event
 */
function EventTasksTab({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { tasks, createTask, updateTaskStatus, assignTask } = useTasks();
  const { events } = useEvents();

  // Local state for the tasks tab
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFiltersType>({});

  // Filter tasks for this specific event
  const eventTasks = tasks.filter((task) => task.event?.id === eventId);

  // Get current event information
  const currentEvent = events.find((event) => event.id === eventId);

  /**
   * Handle task creation for this event
   */
  const handleCreateTask = async (data: CreateTaskData) => {
    try {
      // Automatically associate the task with this event
      const eventTaskData: CreateTaskData = {
        ...data,
        eventId: eventId,
        // If event has a group, use it; otherwise don't set groupId
        groupId: currentEvent?.group?.id || undefined,
      };

      console.log("Creating event task:", eventTaskData);
      await createTask(eventTaskData);
      setIsCreateModalOpen(false);
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
    let filtered = [...eventTasks];

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
      {/* Event Tasks Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] font-inter">
            Event Tasks
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">
            Tasks for {currentEvent?.name || "this event"} ({eventTasks.length}{" "}
            total)
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:bg-[var(--primary)]/80 transition-colors font-inter"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event Task
        </button>
      </div>

      {/* Task Filters */}
      <TaskFilters
        currentFilters={filters}
        onFilterChange={setFilters}
        availableGroups={[]} // Empty since we're in event context
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
          showGroupInfo={true} // Show group info since event tasks can be from different groups
        />
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
        defaultEventId={eventId}
        defaultGroupId={currentEvent?.group?.id}
        availableGroups={
          currentEvent?.group
            ? [
                {
                  id: currentEvent.group.id,
                  name: currentEvent.group.name,
                  type: currentEvent.group.type,
                },
              ]
            : []
        }
        availableEvents={
          currentEvent
            ? [
                {
                  id: currentEvent.id,
                  name: currentEvent.name,
                  startDate: currentEvent.startDate,
                },
              ]
            : []
        }
      />
    </div>
  );
}

/**
 * Event Comments Tab Component
 * Comment thread system for event discussion (not real-time chat)
 */
function EventCommentsTab({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const { loadComments, createComment, toggleLike, getEventComments, loading } =
    useEventComments();

  const [commentInput, setCommentInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const comments = getEventComments(eventId);
  const isLoading = loading[eventId] || false;

  // Load comments when component mounts or eventId changes
  useEffect(() => {
    loadComments(eventId);
  }, [eventId, loadComments]);

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!commentInput.trim() || !user?.id) return;

    try {
      await createComment(eventId, {
        content: commentInput.trim(),
        parentCommentId: replyingTo || undefined,
      });

      setCommentInput("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  // Handle like toggle
  const handleLike = async (commentId: string) => {
    try {
      await toggleLike(eventId, commentId);
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  // Handle key presses
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-[var(--primary)]" />
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Event Discussion
          </h3>
          <span className="text-sm text-[var(--muted-foreground)]">
            ({comments.length} {comments.length === 1 ? "comment" : "comments"})
          </span>
        </div>
      </div>

      {/* Comment Input */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
        {replyingTo && (
          <div className="mb-3 p-2 bg-[var(--muted)]/50 rounded text-sm">
            <span className="text-[var(--muted-foreground)]">
              Replying to comment...
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-2 text-[var(--primary)] hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="space-y-3">
          <textarea
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              replyingTo
                ? "Write a reply..."
                : "Share your thoughts about this event..."
            }
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md
                       text-[var(--foreground)] placeholder-[var(--muted-foreground)] text-sm
                       focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent
                       resize-none"
            rows={3}
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--muted-foreground)]">
              Tip: Press Cmd/Ctrl + Enter to post
            </p>
            <button
              onClick={handleSubmitComment}
              disabled={!commentInput.trim() || isLoading || !user?.id}
              className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md
                         hover:bg-[var(--primary)]/90 transition-colors text-sm font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Posting..." : replyingTo ? "Reply" : "Comment"}
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-[var(--muted-foreground)] mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              No comments yet
            </h4>
            <p className="text-[var(--muted-foreground)] max-w-sm mx-auto">
              Be the first to comment on this event. Share your thoughts, ask
              questions, or provide updates.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <EventCommentItem
              key={comment.id}
              comment={comment}
              onLike={handleLike}
              onReply={setReplyingTo}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Event Comment Item Component
 * Displays individual comments and replies
 */
function EventCommentItem({
  comment,
  onLike,
  onReply,
}: {
  comment: EventComment;
  onLike: (commentId: string) => void;
  onReply: (commentId: string | null) => void;
}) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-3">
      {/* Main Comment */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium shrink-0">
            {comment.author.name?.charAt(0).toUpperCase() || "?"}
          </div>

          <div className="flex-1 min-w-0">
            {/* Author and time */}
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium text-[var(--foreground)] text-sm">
                {comment.author.name}
              </h4>
              <span className="text-xs text-[var(--muted-foreground)]">
                {formatTime(comment.createdAt)}
              </span>
            </div>

            {/* Comment content */}
            <p className="text-[var(--foreground)] text-sm leading-relaxed mb-3">
              {comment.content}
            </p>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onLike(comment.id)}
                className="flex items-center space-x-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
              >
                <Heart className="h-3 w-3" />
                <span>{comment.likeCount}</span>
              </button>

              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center space-x-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
              >
                <Reply className="h-3 w-3" />
                <span>Reply</span>
              </button>

              <button className="flex items-center space-x-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                <MoreVertical className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-3">
          {comment.replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-[var(--muted)]/30 border border-[var(--border)]/50 rounded-lg p-3"
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium shrink-0 text-xs">
                  {reply.author.name?.charAt(0).toUpperCase() || "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="font-medium text-[var(--foreground)] text-sm">
                      {reply.author.name}
                    </h5>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatTime(reply.createdAt)}
                    </span>
                  </div>

                  <p className="text-[var(--foreground)] text-sm leading-relaxed mb-2">
                    {reply.content}
                  </p>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onLike(reply.id)}
                      className="flex items-center space-x-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                    >
                      <Heart className="h-3 w-3" />
                      <span>{reply.likeCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
