"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Users,
  MoreVertical,
  Phone,
  Video,
  Info,
  ArrowLeft,
} from "lucide-react";
import { useChat } from "@/hooks/socket";
import { useAuth } from "@/context/AuthContext";
import type { Group } from "@/types/groups";
import type { ChatMessage } from "@/context/SocketContext";

/**
 * Main Chat Window - Right panel showing messages and input
 *
 * Instagram/iMessage style chat interface with messages,
 * typing indicators, and message composition.
 * Mobile: Includes back button to return to chat list.
 */
interface ChatWindowProps {
  group: Group | null;
  onBackToSidebar?: () => void;
}

export function ChatWindow({ group, onBackToSidebar }: ChatWindowProps) {
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sendMessage,
    onlineUsers,
    typingUsers,
    onlineUserCount,
    isConnected,
    startTyping,
    stopTyping,
    isTyping,
    activelyJoinGroup,
    activelyLeaveGroup,
  } = useChat(group?.id || "");

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Actively join group when user opens the chat (marks messages as read)
  useEffect(() => {
    if (group?.id) {
      console.log(
        `[ChatWindow] User opened chat for group ${group.id} - actively joining`
      );
      activelyJoinGroup();
    }

    // Leave group when component unmounts or group changes
    return () => {
      if (group?.id) {
        console.log(`[ChatWindow] User left chat for group ${group.id}`);
        activelyLeaveGroup();
      }
    };
  }, [group?.id, activelyJoinGroup, activelyLeaveGroup]);

  // Handle message sending
  const handleSendMessage = () => {
    if (messageInput.trim() && group) {
      sendMessage(messageInput.trim());
      setMessageInput("");
      stopTyping();
      // No need to markGroupAsRead here - user is already actively joined
    }
  };

  // Handle input changes with typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Start typing indicator if not already typing
    if (e.target.value.trim() && !isTyping) {
      startTyping();
    }
  };

  // Handle key presses
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!group) {
    return <ChatWindowEmpty />;
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--background)] h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Back Button - Mobile Only */}
            {onBackToSidebar && (
              <button
                onClick={onBackToSidebar}
                className="md:hidden p-2 hover:bg-[var(--muted)] rounded-lg transition-colors -ml-2"
                aria-label="Back to chats"
              >
                <ArrowLeft className="h-5 w-5 text-[var(--foreground)]" />
              </button>
            )}

            {/* Group Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>

            {/* Group Info */}
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">
                {group.name}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {onlineUserCount > 0
                  ? `${onlineUserCount} online`
                  : "No one online"}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
              <Phone className="h-5 w-5 text-[var(--muted-foreground)]" />
            </button>
            <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
              <Video className="h-5 w-5 text-[var(--muted-foreground)]" />
            </button>
            <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
              <Info className="h-5 w-5 text-[var(--muted-foreground)]" />
            </button>
            <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
              <MoreVertical className="h-5 w-5 text-[var(--muted-foreground)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 h-full overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-[var(--muted-foreground)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Start the conversation
            </h3>
            <p className="text-[var(--muted-foreground)]">
              Be the first to send a message to {group.name}
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === user?.id;
              const showAvatar =
                index === 0 ||
                messages[index - 1].senderId !== message.senderId;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={isOwnMessage}
                  showAvatar={showAvatar}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2">
          <div className="flex items-center space-x-2 text-sm text-[var(--muted-foreground)]">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onBlur={stopTyping}
              placeholder={
                isConnected
                  ? `Message ${group.name}...`
                  : "Disconnected - reconnecting..."
              }
              disabled={!isConnected}
              className="w-full px-4 py-3 bg-[var(--muted)]/20 dark:bg-[var(--muted)] border border-[var(--border)] rounded-full 
                         text-[var(--foreground)] placeholder-[var(--muted-foreground)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || !isConnected}
            className="p-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full 
                       hover:bg-[var(--primary)]/90 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual Message Bubble Component
 */
interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar: boolean;
}

function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
}: MessageBubbleProps) {
  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`flex items-end space-x-2 ${
        isOwnMessage ? "justify-end" : "justify-start"
      }`}
    >
      {/* Avatar for other users */}
      {!isOwnMessage && (
        <div className="w-8 h-8 flex-shrink-0">
          {showAvatar ? (
            <div className="w-8 h-8 bg-linear-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-white">
                {message.senderName.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <div className="w-8 h-8" /> // Spacer
          )}
        </div>
      )}

      {/* Message Content */}
      <div
        className={`max-w-xs lg:max-w-md ${isOwnMessage ? "order-first" : ""}`}
      >
        {/* Sender name for other users */}
        {!isOwnMessage && showAvatar && (
          <p className="text-xs text-[var(--muted-foreground)] mb-1 px-3">
            {message.senderName}
          </p>
        )}

        {/* Message bubble */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwnMessage
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-br-md"
              : "bg-(--muted)/20 dark:bg-[var(--muted)] text-[var(--foreground)] rounded-bl-md"
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>

        {/* Timestamp */}
        <p
          className={`text-xs text-[var(--muted-foreground)] mt-1 px-3 ${
            isOwnMessage ? "text-right" : "text-left"
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

/**
 * Empty Chat State - When no group is selected
 */
function ChatWindowEmpty() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[var(--muted)]/20">
      <div className="text-center">
        <div className="w-24 h-24 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="h-12 w-12 text-white dark:text-[var(--muted-foreground)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Choose a group to start chatting
        </h2>
        <p className="text-[var(--muted-foreground)] max-w-md">
          Select a group from the sidebar to view your conversation history and
          send new messages.
        </p>
      </div>
    </div>
  );
}
