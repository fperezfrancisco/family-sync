"use client";

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
  const { connectionError } = useSocket();
  const searchParams = useSearchParams();

  // Get the groupId from URL parameters and find the corresponding group
  const initialGroup = useMemo(() => {
    const groupId = searchParams.get("groupId");
    if (groupId && groups) {
      return groups.find((group) => group.id === groupId) || null;
    }
    return null;
  }, [searchParams, groups]);

  // Loading state while groups are being fetched
  if (groupsLoading) {
    return (
      <div className="-m-6 lg:-m-8 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your groups...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no groups exist
  if (!groupsLoading && groups.length === 0) {
    return (
      <div className="-m-6 lg:-m-8 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] flex items-center justify-center bg-white">
        <div className="text-center">
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
      <div className="-m-6 lg:-m-8 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] flex items-center justify-center bg-white">
        <div className="text-center">
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

  // Main chat interface - use negative margins to escape container padding
  // h variables: h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)]
  return (
    <div className="h-full w-full">
      <ChatLayout initialGroup={initialGroup} />
    </div>
  );
}
