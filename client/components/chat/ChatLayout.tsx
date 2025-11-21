"use client";

import { useState } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import type { Group } from "@/types/groups";

/**
 * Main Chat Layout - Instagram/iMessage style split view
 *
 * Left sidebar shows group list, right panel shows chat window.
 * Responsive design that adapts to mobile/desktop.
 */
export function ChatLayout() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  return (
    <div className="h-[calc(100vh-200px)] bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="flex h-full">
        {/* Left Sidebar - Group List */}
        <ChatSidebar
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
        />

        {/* Right Panel - Chat Window */}
        <ChatWindow group={selectedGroup} />
      </div>
    </div>
  );
}
