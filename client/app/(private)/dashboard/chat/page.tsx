"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { ChatLayout } from "@/components/chat";
import { useSocket } from "@/hooks/socket";
import { useGroups } from "@/context/GroupsContext";

/**
 * Chat Page - Real-time Group Messaging
 *
 * Instagram/iMessage style interface for group chat functionality.
 * Uses Socket.IO for real-time messaging between group members.
 */
export default function ChatPage() {
  const { groups, loading: groupsLoading } = useGroups();
  const { isConnected, isConnecting, connectionError } = useSocket();

  // Loading state while groups are being fetched
  if (groupsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-inter">
              Chat
            </h1>
            <p className="text-muted-foreground mt-2 font-inter">
              Stay connected with your groups
            </p>
          </div>
        </div>

        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your groups...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no groups exist
  if (!groupsLoading && groups.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-inter">
              Chat
            </h1>
            <p className="text-muted-foreground mt-2 font-inter">
              Stay connected with your groups
            </p>
          </div>
        </div>

        <div className="text-center py-16">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2 font-inter">
            No Groups Yet
          </h2>
          <p className="text-muted-foreground mb-6 font-inter">
            Join or create a group to start chatting with your family and
            friends
          </p>
          <button
            onClick={() => (window.location.href = "/dashboard/groups")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md 
                       hover:bg-primary/90 transition-colors font-inter"
          >
            Go to Groups
          </button>
        </div>
      </div>
    );
  }

  // Show connection error if socket failed to connect
  if (connectionError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-inter">
              Chat
            </h1>
            <p className="text-muted-foreground mt-2 font-inter">
              Stay connected with your groups
            </p>
          </div>
        </div>

        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2 font-inter">
            Connection Error
          </h2>
          <p className="text-muted-foreground mb-6 font-inter">
            Unable to connect to chat servers: {connectionError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md 
                       hover:bg-primary/90 transition-colors font-inter"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="space-y-6">
      {/* Page header with connection status */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-inter">
            Chat
          </h1>
          <div className="flex items-center space-x-2 mt-2">
            <p className="text-muted-foreground font-inter">
              Stay connected with your groups
            </p>
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnecting
                    ? "bg-yellow-500 animate-pulse"
                    : isConnected
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {isConnecting
                  ? "Connecting..."
                  : isConnected
                  ? "Connected"
                  : "Disconnected"}
              </span>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {groups.length} group{groups.length !== 1 ? "s" : ""} available
        </div>
      </div>

      {/* Main Chat Layout */}
      <ChatLayout />

      {/* Chat Instructions */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-2">Chat Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div>
            <strong>Real-time messaging:</strong> Messages appear instantly for
            all group members
          </div>
          <div>
            <strong>Typing indicators:</strong> See when others are typing a
            message
          </div>
          <div>
            <strong>Online status:</strong> Know who&apos;s currently online in
            each group
          </div>
        </div>
      </div>
    </div>
  );
}
