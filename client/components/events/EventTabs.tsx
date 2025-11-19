"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Image as ImageIcon,
  CheckSquare,
  Info,
  Users,
} from "lucide-react";
import { Event } from "@/types/events";

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
      <div className="border-b border-border">
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
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-foreground">Attendees</h3>
            <span className="text-sm text-muted-foreground">
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
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        {status === "not_attending" ? "Not Attending" : status}{" "}
                        ({attendees.length})
                      </h4>
                      <div className="space-y-2">
                        {attendees.map((attendee, index) => (
                          <div
                            key={attendee.user.id || index}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                {attendee.user.name?.charAt(0).toUpperCase() ||
                                  "?"}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {attendee.user.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {attendee.user.email}
                                </p>
                                {attendee.respondedAt && (
                                  <p className="text-xs text-muted-foreground">
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
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No attendees yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Attendees will appear here when they RSVP
              </p>
            </div>
          )}
        </div>

        {/* Event Details Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Event Details
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Privacy & Settings
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visibility:</span>
                  <span className="text-foreground">
                    {event.isPrivate ? "Private" : "Public"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RSVP Required:</span>
                  <span className="text-foreground">
                    {event.requireRSVP ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guest Invites:</span>
                  <span className="text-foreground">
                    {event.allowGuestInvites ? "Allowed" : "Not Allowed"}
                  </span>
                </div>
                {event.maxAttendees && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Max Attendees:
                    </span>
                    <span className="text-foreground">
                      {event.maxAttendees}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {event.group && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Associated Group
                </h4>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-foreground">
                    {event.group.name}
                  </p>
                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded capitalize">
                    {event.group.type}
                  </span>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Timestamps
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="text-foreground">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="text-foreground">
                    {new Date(event.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Statistics */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Event Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {attendeesByStatus.attending?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Attending</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {attendeesByStatus.maybe?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Maybe</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {attendeesByStatus.not_attending?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Not Attending</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {attendeesByStatus.pending?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder tab components for future implementation
 */
function ChatTab({ eventId }: { eventId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Event Chat Coming Soon
      </h3>
      <p className="text-muted-foreground text-center max-w-md">
        Event chat functionality will be implemented here. Attendees will be
        able to discuss event details, coordinate, and share updates.
      </p>
      <p className="text-sm text-muted-foreground mt-4">Event ID: {eventId}</p>
    </div>
  );
}

function MediaTab({ eventId }: { eventId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Event Media Coming Soon
      </h3>
      <p className="text-muted-foreground text-center max-w-md">
        Media sharing functionality will be implemented here. Attendees will be
        able to upload photos, videos, and share memories from the event.
      </p>
      <p className="text-sm text-muted-foreground mt-4">Event ID: {eventId}</p>
    </div>
  );
}

function TasksTab({ eventId }: { eventId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <CheckSquare className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Event Tasks Coming Soon
      </h3>
      <p className="text-muted-foreground text-center max-w-md">
        Task management functionality will be implemented here. Organizers will
        be able to create tasks, assign them to attendees, and track event
        preparation progress.
      </p>
      <p className="text-sm text-muted-foreground mt-4">Event ID: {eventId}</p>
    </div>
  );
}
