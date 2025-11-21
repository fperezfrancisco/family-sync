"use client";

import { useState } from "react";
import { MessageCircle, Users, Search, Plus } from "lucide-react";
import { useGroups } from "@/context/GroupsContext";
import { useChat, useSocket } from "@/hooks/socket";
import type { Group } from "@/types/groups";

/**
 * Chat Sidebar - Left panel showing group chat list
 *
 * Displays all groups the user belongs to for chat selection.
 * Similar to Instagram DMs or iMessage conversation list.
 */
interface ChatSidebarProps {
  selectedGroup: Group | null;
  onSelectGroup: (group: Group) => void;
}

export function ChatSidebar({
  selectedGroup,
  onSelectGroup,
}: ChatSidebarProps) {
  const { groups } = useGroups();
  const { isConnected } = useSocket();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter groups based on search term
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 border-r border-[var(--border)] bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Chats</h2>
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
              title={isConnected ? "Connected" : "Disconnected"}
            />
            <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
              <Plus className="h-4 w-4 text-[var(--foreground)]" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[var(--muted)] border border-[var(--border)] rounded-lg 
                       text-[var(--foreground)] placeholder-[var(--muted-foreground)] 
                       focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredGroups.length === 0 ? (
          <div className="p-4 text-center">
            <MessageCircle className="h-8 w-8 text-[var(--muted-foreground)] mx-auto mb-2" />
            <p className="text-sm text-[var(--muted-foreground)]">
              {searchTerm ? "No groups found" : "No groups available"}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredGroups.map((group) => (
              <ChatSidebarItem
                key={group.id}
                group={group}
                isSelected={selectedGroup?.id === group.id}
                onClick={() => onSelectGroup(group)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Connection Status Footer */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--muted)]/30">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-[var(--muted-foreground)]">
            {isConnected ? "Connected to chat" : "Reconnecting..."}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual Chat Sidebar Item
 */
interface ChatSidebarItemProps {
  group: Group;
  isSelected: boolean;
  onClick: () => void;
}

function ChatSidebarItem({ group, isSelected, onClick }: ChatSidebarItemProps) {
  const { onlineUserCount, messages } = useChat(group.id);
  const lastMessage = messages[messages.length - 1];

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg text-left transition-colors ${
        isSelected
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "hover:bg-[var(--muted)] text-[var(--foreground)]"
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Group Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Group Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium truncate">{group.name}</h3>
            <div className="flex items-center space-x-2">
              {/* Online indicator */}
              {onlineUserCount > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs">{onlineUserCount}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm opacity-70 truncate">
            {lastMessage ? lastMessage.content : "No messages yet"}
          </p>

          {/* Last message time */}
          {lastMessage && (
            <p className="text-xs opacity-50 mt-1">
              {new Date(lastMessage.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
