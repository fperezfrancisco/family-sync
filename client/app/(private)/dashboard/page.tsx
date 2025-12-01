"use client";

import React, { useEffect, useState } from "react";
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
import { CreateEventData } from "@/types/events";
import Image from "next/image";
import { useTasks } from "@/context/TasksContext";
import { useSocket } from "@/context/SocketContext";

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

  console.log("User: ", user);

  // Modal states
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

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
      value: "12",
      icon: MessageCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]);

  // Mock data for demonstration - replace with real data later

  const recentActivity = [
    {
      id: 1,
      type: "event",
      message: 'New event "Family BBQ" was added to Smith Family group',
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "task",
      message: 'Task "Buy groceries" was completed by John',
      time: "4 hours ago",
    },
    {
      id: 3,
      type: "message",
      message: "3 new messages in Friends group chat",
      time: "6 hours ago",
    },
  ];

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
              value: tasks ? tasks.length.toString() : "0",
            };
          }
          return stat;
        })
      );
    };
    updateStats();
  }, [groups, events, tasks]);

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
        {stats.map((stat, index) => {
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
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 py-2 rounded-md hover:bg-accent transition-colors duration-150"
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

          <button className="w-full mt-4 text-sm text-primary hover:text-primary/80 font-medium font-inter">
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
              className="w-full flex items-center justify-between p-3 rounded-md 
                             border border-border hover:bg-accent transition-colors duration-150 font-inter"
            >
              <span className="font-medium">Create New Event</span>
              <Calendar className="h-5 w-5" />
            </button>

            <button
              className="w-full flex items-center justify-between p-3 rounded-md 
                             border border-border hover:bg-accent transition-colors duration-150 font-inter"
            >
              <span className="font-medium text-foreground">Add Task</span>
              <CheckSquare className="h-5 w-5 text-muted-foreground" />
            </button>

            <button
              className="w-full flex items-center justify-between p-3 rounded-md 
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
    </div>
  );
}
