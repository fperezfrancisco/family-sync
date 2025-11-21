/**
 * Example Usage Guide for Socket Hooks
 *
 * This file demonstrates how to use the custom socket hooks
 * in various scenarios within your React components.
 *
 * @fileoverview Socket hooks usage examples
 */

/**
 * EXAMPLE 1: Basic Socket Connection Status
 *
 * Use this pattern to show connection status in your UI
 */
/*
import { useSocket } from "@/hooks/socket";

function ConnectionStatus() {
  const { isConnected, isConnecting, connectionError } = useSocket();

  if (isConnecting) {
    return <div className="text-yellow-500">Connecting to chat...</div>;
  }

  if (connectionError) {
    return <div className="text-red-500">Connection error: {connectionError}</div>;
  }

  if (!isConnected) {
    return <div className="text-gray-500">Disconnected from chat</div>;
  }

  return <div className="text-green-500">Connected to real-time chat!</div>;
}
*/

/**
 * EXAMPLE 2: Group Chat Component
 *
 * Complete chat interface using useChat hook
 */
/*
import { useState } from "react";
import { useChat } from "@/hooks/socket";

interface GroupChatProps {
  groupId: string;
}

function GroupChat({ groupId }: GroupChatProps) {
  const [messageInput, setMessageInput] = useState("");
  const {
    messages,
    sendMessage,
    onlineUsers,
    typingUsers,
    onlineUserCount,
    isConnected,
    startTyping,
    stopTyping,
    isTyping
  } = useChat(groupId);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    // Start typing indicator
    if (e.target.value && !isTyping) {
      startTyping();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
      stopTyping();
    }
  };

  if (!isConnected) {
    return <ConnectionStatus />;
  }

  return (
    <div className="flex flex-col h-96 border rounded-lg">
      {/* Chat Header *\/}
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-semibold">Group Chat</h3>
        <p className="text-sm text-gray-600">
          {onlineUserCount} online
        </p>
      </div>

      {/* Messages Area *\/}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col">
            <div className="text-xs text-gray-500">
              {message.senderName} • {new Date(message.timestamp).toLocaleTimeString()}
            </div>
            <div className="p-2 bg-blue-100 rounded">
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Typing Indicator *\/}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500 italic">
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}

      {/* Message Input *\/}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onBlur={stopTyping}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
*/

/**
 * EXAMPLE 3: Online Users Display
 *
 * Show who's currently online in a group
 */
/*
import { useChat } from "@/hooks/socket";

interface OnlineUsersProps {
  groupId: string;
}

function OnlineUsers({ groupId }: OnlineUsersProps) {
  const { onlineUsers, onlineUserCount, isConnected } = useChat(groupId);

  if (!isConnected) {
    return <div className="text-gray-400">Offline</div>;
  }

  return (
    <div className="p-4 bg-green-50 rounded-lg">
      <h4 className="font-medium text-green-800">
        Online Users ({onlineUserCount})
      </h4>
      <div className="mt-2 space-y-1">
        {onlineUsers.map((userId) => (
          <div key={userId} className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm">User {userId}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
*/

/**
 * EXAMPLE 4: Message Composer with Advanced Features
 *
 * Advanced message input with typing indicators and validation
 */
/*
import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/socket";

interface MessageComposerProps {
  groupId: string;
  placeholder?: string;
}

function MessageComposer({ groupId, placeholder = "Type a message..." }: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { sendMessage, startTyping, stopTyping, isTyping, isConnected } = useChat(groupId);

  const handleSend = () => {
    if (message.trim() && isConnected) {
      sendMessage(message.trim());
      setMessage("");
      stopTyping();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (e.target.value.trim() && !isTyping) {
      startTyping();
    } else if (!e.target.value.trim() && isTyping) {
      stopTyping();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Stop typing when component unmounts or loses focus
  useEffect(() => {
    return () => {
      if (isTyping) {
        stopTyping();
      }
    };
  }, [isTyping, stopTyping]);

  return (
    <div className={`border rounded-lg transition-colors ${isFocused ? 'border-blue-500' : 'border-gray-300'}`}>
      <textarea
        ref={inputRef}
        value={message}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          stopTyping();
        }}
        placeholder={isConnected ? placeholder : "Disconnected - reconnecting..."}
        disabled={!isConnected}
        className="w-full p-3 resize-none border-none outline-none min-h-[40px] max-h-32"
        rows={1}
      />
      
      <div className="flex justify-between items-center p-2 border-t bg-gray-50">
        <div className="text-sm text-gray-500">
          {isTyping && "Typing..."}
          {!isConnected && "Disconnected"}
        </div>
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || !isConnected}
          className="px-4 py-1 bg-blue-500 text-white text-sm rounded disabled:opacity-50 hover:bg-blue-600 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
*/

export {}; // Make this a module
