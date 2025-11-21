"use client";

import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useSocket } from "@/hooks/socket";

/**
 * Connection Status Indicator
 *
 * Shows the real-time connection status of the Socket.IO connection.
 * Used across chat components to provide user feedback.
 */
interface ConnectionStatusProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ConnectionStatus({
  showText = true,
  size = "md",
  className = "",
}: ConnectionStatusProps) {
  const { isConnected, isConnecting, connectionError } = useSocket();

  const sizeClasses = {
    sm: "w-3 h-3 text-xs",
    md: "w-4 h-4 text-sm",
    lg: "w-5 h-5 text-base",
  };

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const getStatus = () => {
    if (connectionError) {
      return {
        color: "text-red-500",
        bgColor: "bg-red-500",
        icon: <WifiOff className={iconSize[size]} />,
        text: "Connection Error",
        description: connectionError,
      };
    }

    if (isConnecting) {
      return {
        color: "text-yellow-500",
        bgColor: "bg-yellow-500",
        icon: <Loader2 className={`${iconSize[size]} animate-spin`} />,
        text: "Connecting...",
        description: "Establishing connection to chat servers",
      };
    }

    if (isConnected) {
      return {
        color: "text-green-500",
        bgColor: "bg-green-500",
        icon: <Wifi className={iconSize[size]} />,
        text: "Connected",
        description: "Real-time chat is active",
      };
    }

    return {
      color: "text-red-500",
      bgColor: "bg-red-500",
      icon: <WifiOff className={iconSize[size]} />,
      text: "Disconnected",
      description: "Unable to connect to chat servers",
    };
  };

  const status = getStatus();

  if (!showText) {
    return (
      <div
        className={`${sizeClasses[size]} ${status.bgColor} rounded-full ${className}`}
        title={status.description}
      />
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} ${status.bgColor} rounded-full`} />
      <div className={status.color}>{status.icon}</div>
      {showText && (
        <span className={`${status.color} ${sizeClasses[size]} font-medium`}>
          {status.text}
        </span>
      )}
    </div>
  );
}

/**
 * Detailed Connection Status Card
 *
 * More comprehensive connection status for settings/debug views
 */
export function ConnectionStatusCard() {
  const { isConnected, connectionError, socket } = useSocket();

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold text-foreground mb-3">Connection Status</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          <ConnectionStatus size="sm" />
        </div>

        {socket && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Socket ID:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {socket.id || "Not assigned"}
            </code>
          </div>
        )}

        {connectionError && (
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-muted-foreground">Error:</span>
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {connectionError}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Real-time Features:
          </span>
          <span
            className={`text-xs px-2 py-1 rounded ${
              isConnected
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isConnected ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>
    </div>
  );
}
