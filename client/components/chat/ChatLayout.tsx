"use client";

import { useState } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import type { Group } from "@/types/groups";

interface ChatLayoutProps {
  initialGroup?: Group | null;
}

/**
 * Main Chat Layout - Instagram/iMessage style split view
 *
 * Desktop: Shows sidebar and chat window side by side
 * Mobile: Shows either sidebar OR chat window based on selection
 * - No group selected: Shows sidebar (group list)
 * - Group selected: Shows chat window with back button
 */
export function ChatLayout({ initialGroup = null }: ChatLayoutProps) {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(
    initialGroup
  );

  // Mobile view handler - clears selection to return to sidebar
  const handleBackToSidebar = () => {
    setSelectedGroup(null);
  };

  // Mobile view handler - selects group and switches to chat view
  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
  };

  //h-full min-h-[calc(100vh-64px)] lg:min-h-[calc(100vh-80px)]
  return (
    <div className="h-[calc(100vh-32px)] md:h-[calc(100vh-64px)] bg-[var(--background)] w-full ">
      <div className="flex h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] w-full">
        {/* Left Sidebar - Group List */}
        {/* Desktop: Always visible, Mobile: Only when no group selected */}
        <div
          className={`${
            selectedGroup ? " hidden md:flex" : "flex"
          } shrink-0 w-full md:w-auto `}
        >
          <ChatSidebar
            selectedGroup={selectedGroup}
            onSelectGroup={handleSelectGroup}
          />
        </div>

        {/* Right Panel - Chat Window */}
        {/* Desktop: Always visible, Mobile: Only when group selected */}
        <div
          className={`${
            selectedGroup ? "flex" : "hidden md:flex"
          } flex-1 w-full grow`}
        >
          <ChatWindow
            group={selectedGroup}
            onBackToSidebar={handleBackToSidebar}
          />
        </div>
      </div>
    </div>
  );
}
