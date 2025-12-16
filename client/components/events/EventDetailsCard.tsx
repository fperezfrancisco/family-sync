"use client";

import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Globe,
  Clock,
  Users,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Event } from "@/types/events";

interface EventDetailsCardProps {
  event: Event;
}

/**
 * EventDetailsCard Component
 * Displays guest-relevant event details in an organized, collapsible format
 * Focuses on when, where, and essential logistics
 */
export default function EventDetailsCard({ event }: EventDetailsCardProps) {
  const [expandedSections, setExpandedSections] = useState({
    datetime: true,
    location: true,
    details: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if RSVP deadline has passed
  const isRSVPDeadlinePassed =
    event.rsvpDeadline && new Date(event.rsvpDeadline) < new Date();

  return (
    <div className="space-y-3">
      {/* Date & Time Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("datetime")}
          className="w-full flex items-center justify-between p-4 hover:bg-[var(--muted)]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-foreground" />
            <span className="font-semibold text-foreground">When</span>
          </div>
          {expandedSections.datetime ? (
            <ChevronUp className="h-5 w-5 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[var(--muted-foreground)]" />
          )}
        </button>

        {expandedSections.datetime && (
          <div className="border-t border-[var(--border)] px-4 py-3 space-y-2 text-sm bg-[var(--muted)]/30">
            {event.isAllDay ? (
              <>
                <div className="flex items-start gap-3">
                  <span className="text-[var(--muted-foreground)]">Date:</span>
                  <span className="text-[var(--foreground)] font-medium">
                    {new Date(event.startDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {event.endDate && (
                  <div className="flex items-start gap-3">
                    <span className="text-[var(--muted-foreground)]">
                      Until:
                    </span>
                    <span className="text-[var(--foreground)] font-medium">
                      {new Date(event.endDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs mt-2">
                  <Clock className="h-4 w-4" />
                  <span>All-day event</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <span className="text-[var(--muted-foreground)]">
                    Starts:
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[var(--foreground)] font-medium">
                      {new Date(event.startDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-[var(--muted-foreground)]">
                      {formatTime(event.startDate)}
                    </span>
                  </div>
                </div>
                {event.endDate && (
                  <div className="flex items-start gap-3">
                    <span className="text-[var(--muted-foreground)]">
                      Ends:
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[var(--foreground)] font-medium">
                        {new Date(event.endDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-[var(--muted-foreground)]">
                        {formatTime(event.endDate)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
            {event.timezone && (
              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mt-2">
                <Clock className="h-3 w-3" />
                <span>{event.timezone}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("location")}
          className="w-full flex items-center justify-between p-4 hover:bg-[var(--muted)]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {event.isVirtual ? (
              <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <MapPin className="h-5 w-5 text-foreground" />
            )}
            <span className="font-semibold text-foreground">Where</span>
          </div>
          {expandedSections.location ? (
            <ChevronUp className="h-5 w-5 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[var(--muted-foreground)]" />
          )}
        </button>

        {expandedSections.location && (
          <div className="border-t border-[var(--border)] px-4 py-3 space-y-2 text-sm bg-[var(--muted)]/30">
            {event.isVirtual ? (
              <>
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <span className="text-[var(--foreground)] font-medium">
                    Virtual Event
                  </span>
                </div>
                {event.locationUrl && (
                  <a
                    href={event.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline break-all text-xs"
                  >
                    {event.locationUrl}
                  </a>
                )}
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-foreground mt-0.5" />
                  <div className="flex flex-col space-y-2">
                    <span className="text-foreground font-medium">
                      {event.location || "Location not specified"}
                    </span>
                    {event.locationUrl && (
                      <a
                        href={event.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                      >
                        View on Map
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Additional Details Section */}
      {(event.maxAttendees || event.dressCode || event.rsvpDeadline) && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("details")}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--muted)]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[var(--foreground)]" />
              <span className="font-semibold text-[var(--foreground)]">
                Additional Info
              </span>
            </div>
            {expandedSections.details ? (
              <ChevronUp className="h-5 w-5 text-[var(--muted-foreground)]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[var(--muted-foreground)]" />
            )}
          </button>

          {expandedSections.details && (
            <div className="border-t border-[var(--border)] px-4 py-3 space-y-3 text-sm bg-[var(--muted)]/30">
              {event.maxAttendees && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                    <Users className="h-4 w-4" />
                    <span>Max Capacity</span>
                  </div>
                  <span className="text-[var(--foreground)] font-medium">
                    {event.maxAttendees}{" "}
                    {event.maxAttendees === 1 ? "person" : "people"}
                  </span>
                </div>
              )}

              {event.dressCode && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">
                    Dress Code
                  </span>
                  <span className="text-[var(--foreground)] font-medium">
                    {event.dressCode}
                  </span>
                </div>
              )}

              {event.rsvpDeadline && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">
                    RSVP Deadline
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-[var(--foreground)] font-medium">
                      {new Date(event.rsvpDeadline).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                    {isRSVPDeadlinePassed && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        Deadline passed
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
