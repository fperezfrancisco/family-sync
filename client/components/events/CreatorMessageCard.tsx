"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import { Event } from "@/types/events";

interface CreatorMessageCardProps {
  event: Event;
}

/**
 * CreatorMessageCard Component
 * Displays a personal message from the event creator to invitees
 * Sets the tone and adds personal connection to the event
 */
export default function CreatorMessageCard({ event }: CreatorMessageCardProps) {
  // Don't render if there's no creator message
  if (!event.creatorMessage || event.creatorMessage.trim() === "") {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40">
          <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            Message from {event.owner.name}
          </h3>
          <p className="text-xs text-muted-foreground">Event Organizer</p>
        </div>
      </div>

      {/* Message Content */}
      <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">
        {event.creatorMessage}
      </p>
    </div>
  );
}
