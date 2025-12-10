"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  Users,
  CheckSquare,
  MessageCircle,
  TrendingUp,
  Bell,
} from "lucide-react";
import { useGroups } from "@/context/GroupsContext";
import { useEvents } from "@/context/EventsContext";
import CreateEventModal from "@/components/events/CreateEventModal";
import UpcomingEventsCard from "@/components/dashboard/UpcomingEventsCard";
// INVITATION SYSTEM: Import pending invitations component
import PendingInvitations from "@/components/dashboard/PendingInvitations";
import RecentActivityModal from "@/components/dashboard/RecentActivityModal";
import { CreateEventData } from "@/types/events";
import { RecentActivity } from "@/hooks/useRecentActivity";
import Image from "next/image";
import { useTasks } from "@/context/TasksContext";
import { useSocket } from "@/context/SocketContext";
import { useTotalUnreadMessages } from "@/hooks/useTotalUnreadMessages";
import { useRecentActivity } from "@/hooks/useRecentActivity";

/**
 * Dashboard Page Component
 * Main landing page after user authentication
 * Shows overview of user's groups, events, tasks, and recent activity
 */
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { groups, refreshGroups } = useGroups();
  const { events, createEvent } = useEvents();
  const { tasks } = useTasks();
  const { messages, isLoadingReadStates, getUnreadCount, unreadCounts } =
    useSocket();
  const totalUnreadMessages = useTotalUnreadMessages();
  const recentActivity = useRecentActivity({ limit: 10 }); // Get 10 for modal, display 3 on dashboard
  const router = useRouter();

  //console.log("Unread counts: ", unreadCounts);

  //console.log("User: ", user);

  // Modal states
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isRecentActivityModalOpen, setIsRecentActivityModalOpen] =
    useState(false);

  // Navigation handler for activity items
  const handleActivityNavigation = useCallback(
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

  const [stats, setStats] = useState([
    {
      title: "Active Groups",
      value: groups ? groups.length.toString() : "0",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Upcoming Events",
      value: events ? events.length.toString() : "0",
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Pending Tasks",
      value: tasks ? tasks.length.toString() : "0",
      icon: CheckSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Unread Messages",
      value: totalUnreadMessages ? totalUnreadMessages.toString() : "0",
      icon: MessageCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]);

  /**
   * Handle creating a new event
   */
  const handleCreateEvent = async (eventData: CreateEventData) => {
    try {
      setIsCreatingEvent(true);
      await createEvent(eventData);
      setIsCreateEventModalOpen(false);
    } catch (error) {
      console.error("Failed to create event:", error);
      throw error; // Re-throw to let the modal handle it
    } finally {
      setIsCreatingEvent(false);
    }
  };

  /**
   * Open create event modal
   */
  const handleOpenCreateEventModal = () => {
    setIsCreateEventModalOpen(true);
  };

  /**
   * INVITATION SYSTEM: Handle invitation response to refresh groups data
   */
  const handleInvitationResponse = () => {
    refreshGroups(); // Refresh groups when user accepts/declines invitations
  };

  /**
   * Calculate pending tasks count for the current user
   * Includes tasks that are not completed AND are either:
   * - Assigned to the current user, OR
   * - Not claimed yet and the user can claim them
   */
  const calculatePendingTasksCount = useCallback(() => {
    if (!user || !tasks) return 0;

    const userGroupIds = groups ? groups.map((group) => group.id) : [];
    const userEventIds = events
      ? events
          .filter((event) =>
            event.attendees.some((attendee) => attendee.user._id === user.id)
          )
          .map((event) => event.id)
      : [];

    return tasks.filter((task) => {
      // Skip completed, verified, or cancelled tasks
      if (["completed", "verified", "cancelled"].includes(task.status)) {
        return false;
      }

      // Check if task is assigned to current user
      const isAssignedToUser = task.assignees.some(
        (assignee) => assignee.id === user.id
      );

      // Check if task is unclaimed and user can claim it
      const isUnclaimed = task.assignees.length === 0;
      const canClaimTask =
        isUnclaimed &&
        (task.allowSelfAssign ||
          (task.group && userGroupIds.includes(task.group.id)) ||
          (task.event && userEventIds.includes(task.event.id)));

      return isAssignedToUser || canClaimTask;
    }).length;
  }, [user, tasks, groups, events]);

  useEffect(() => {
    // Update stats when groups or events change
    const updateStats = async () => {
      // Calculate upcoming events count
      const now = new Date();
      const upcomingEventsCount = events
        ? events.filter((event) => new Date(event.startDate) > now).length
        : 0;

      setStats((prevStats) =>
        prevStats.map((stat) => {
          if (stat.title === "Active Groups") {
            return {
              ...stat,
              value: groups ? groups.length.toString() : "0",
            };
          }
          if (stat.title === "Upcoming Events") {
            return {
              ...stat,
              value: upcomingEventsCount.toString(),
            };
          }
          if (stat.title === "Pending Tasks") {
            return {
              ...stat,
              value: calculatePendingTasksCount().toString(),
            };
          }
          if (stat.title === "Unread Messages") {
            return {
              ...stat,
              value: totalUnreadMessages.toString(),
            };
          }
          return stat;
        })
      );
    };
    updateStats();
  }, [
    groups,
    events,
    tasks,
    messages,
    calculatePendingTasksCount,
    totalUnreadMessages,
  ]);

  return (
    <div className="space-y-8 h-fit">
      {/* Page header */}
      <div className="w-full relative flex flex-col gap-4 pb-4">
        <div className="w-full min-h-[120px] aspect-[20/9] md:aspect-[32/9] bg-neutral-400 rounded-2xl overflow-hidden object-bottom">
          {loading ? null : (
            <Image
              src={
                user?.banner?.fullSize ||
                user?.banner?.fullSize ||
                user?.bannerUrl ||
                "/wallpapers/default-lake.jpg"
              }
              alt="User Wallpaper"
              width={2000}
              height={1000}
              className="object-cover object-bottom w-full h-auto"
            />
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-end sm:gap-4 mt-[-90px] md:mt-[-110px]">
          <div className="aspect-square bg-black dark:bg-white rounded-full border-4 border-[var(--background)] size-[180px] md:size-[220px]">
            {loading ? null : (
              <Image
                src={
                  user?.avatar?.fullSize ||
                  user?.avatar?.fullSize ||
                  user?.avatarUrl ||
                  "/avatars/ben-profile.jpg"
                }
                alt="User Avatar"
                width={300}
                height={300}
                className="object-cover rounded-full w-full h-full"
              />
            )}
          </div>
          <div className="w-full flex flex-col items-start py-4">
            <h1 className="text-2xl md:text-3xl font-bold leading-none text-[var(--foreground)] font-inter">
              Welcome back, {user?.name.split(" ")[0] || "User"}!
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2 font-inter">
              Here&apos;s what&apos;s happening with your family and friends.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {isLoadingReadStates && <>Loading...</>}
        {!isLoadingReadStates &&
          stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground font-inter">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2 font-inter">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground font-inter">
              Recent Activity
            </h2>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-4">
            {recentActivity.slice(0, 3).map((activity) => (
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
                  <p className="text-sm font-medium text-foreground font-inter">
                    {activity.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-inter">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setIsRecentActivityModalOpen(true)}
            className="w-full mt-4 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium font-inter"
          >
            View all activity
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 font-inter">
            Quick Actions
          </h2>

          <div className="space-y-3">
            <button
              onClick={handleOpenCreateEventModal}
              className="w-full flex items-center justify-between p-3 rounded-md hover:bg-(--secondary)
                             border border-border hover:bg-accent transition-colors duration-150 font-inter"
            >
              <span className="font-medium">Create New Event</span>
              <Calendar className="h-5 w-5" />
            </button>

            <button
              className="w-full flex items-center justify-between p-3 rounded-md hover:bg-(--secondary) 
                             border border-border hover:bg-accent transition-colors duration-150 font-inter"
            >
              <span className="font-medium text-foreground">Add Task</span>
              <CheckSquare className="h-5 w-5 text-muted-foreground" />
            </button>

            <button
              className="w-full flex items-center justify-between p-3 rounded-md hover:bg-(--secondary) 
                             border border-border hover:bg-accent transition-colors duration-150 font-inter"
            >
              <span className="font-medium text-foreground">
                Invite Members
              </span>
              <Users className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Placeholder sections for future development */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events Preview */}
        <UpcomingEventsCard
          events={events || []}
          onCreateEvent={handleOpenCreateEventModal}
        />

        {/* INVITATION SYSTEM: Pending Invitations */}
        <PendingInvitations onInvitationResponse={handleInvitationResponse} />

        {/* Task Progress */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 font-inter">
            Task Progress
          </h3>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-3" />
            <p className="text-sm text-[var(--muted-foreground)] font-inter">
              No tasks assigned
            </p>
            <button className="text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium mt-2 font-inter">
              Add your first task
            </button>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onSubmit={handleCreateEvent}
        isLoading={isCreatingEvent}
        availableGroups={groups || []}
      />

      {/* Recent Activity Modal */}
      <RecentActivityModal
        isOpen={isRecentActivityModalOpen}
        onClose={() => setIsRecentActivityModalOpen(false)}
      />
    </div>
  );
}
