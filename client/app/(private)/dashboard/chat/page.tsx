"use client";

import React from "react";
import { MessageCircle, Plus } from "lucide-react";

/**
 * Chat Page - Placeholder
 * Shows user's chat conversations and messaging functionality
 */
export default function ChatPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-inter">
            Chat
          </h1>
          <p className="text-muted-foreground mt-2 font-inter">
            Stay connected with your groups
          </p>
        </div>
        <button
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground 
                         rounded-md hover:bg-primary/90 transition-colors font-inter"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </button>
      </div>

      {/* Placeholder content */}
      <div className="text-center py-16">
        <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2 font-inter">
          No Conversations Yet
        </h2>
        <p className="text-muted-foreground mb-6 font-inter">
          Start chatting with your family and friends
        </p>
        <button
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md 
                         hover:bg-primary/90 transition-colors font-inter"
        >
          Start Your First Chat
        </button>
      </div>
    </div>
  );
}
