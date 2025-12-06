/**
 * Connection Monitor Hook
 *
 * Tracks Socket.IO connection state, transport methods, quality metrics,
 * and provides detailed connection analytics for debugging real-time
 * messaging issues across different browsers and network conditions.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { logConnection, logPerformance, logError } from "../utils/debugLogger";
import {
  detectBrowser,
  getBrowserDescription,
  type BrowserInfo,
} from "../utils/browserDetection";

export interface ConnectionEvent {
  type:
    | "connect"
    | "disconnect"
    | "reconnect"
    | "connect_error"
    | "transport_change";
  timestamp: number;
  data?: Record<string, unknown>;
  duration?: number; // For reconnect events
}

export interface ConnectionMetrics {
  totalConnections: number;
  totalDisconnections: number;
  totalReconnections: number;
  totalErrors: number;
  averageReconnectTime: number;
  longestDisconnection: number;
  currentTransport: string;
  transportHistory: string[];
  connectionQuality: "excellent" | "good" | "poor" | "unknown";
}

export interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  transport: string;
  connectionId: string | null;
  lastConnectTime: number | null;
  lastDisconnectTime: number | null;
  currentDisconnectionDuration: number;
  reconnectAttempt: number;
  maxReconnectAttempts: number;
}

interface UseConnectionMonitorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket: any | null;
  enabled?: boolean;
}

export function useConnectionMonitor({
  socket,
  enabled = true,
}: UseConnectionMonitorProps) {
  // Browser detection
  const [browserInfo] = useState<BrowserInfo>(() => detectBrowser());

  // Connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    transport: "unknown",
    connectionId: null,
    lastConnectTime: null,
    lastDisconnectTime: null,
    currentDisconnectionDuration: 0,
    reconnectAttempt: 0,
    maxReconnectAttempts: 5,
  });

  // Connection history and metrics
  const [connectionEvents, setConnectionEvents] = useState<ConnectionEvent[]>(
    []
  );
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>(
    {
      totalConnections: 0,
      totalDisconnections: 0,
      totalReconnections: 0,
      totalErrors: 0,
      averageReconnectTime: 0,
      longestDisconnection: 0,
      currentTransport: "unknown",
      transportHistory: [],
      connectionQuality: "unknown",
    }
  );

  // Refs for tracking reconnection timing
  const disconnectStartTime = useRef<number | null>(null);
  const reconnectTimes = useRef<number[]>([]);

  // Add connection event to history
  const addConnectionEvent = useCallback((event: ConnectionEvent) => {
    setConnectionEvents((prev) => {
      const newEvents = [...prev, event];
      // Keep only last 100 events to prevent memory issues
      return newEvents.slice(-100);
    });
  }, []);

  // Update connection metrics

  // Removed updateMetrics function to avoid circular dependency

  // Monitor disconnection duration
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (connectionState.lastDisconnectTime && !connectionState.isConnected) {
      interval = setInterval(() => {
        const duration = Date.now() - connectionState.lastDisconnectTime!;
        setConnectionState((prev) => ({
          ...prev,
          currentDisconnectionDuration: duration,
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connectionState.lastDisconnectTime, connectionState.isConnected]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket || !enabled) return;

    logConnection("Setting up connection monitor", {
      browser: getBrowserDescription(browserInfo),
      socketId: socket.id,
    });

    // Connection established
    const handleConnect = () => {
      const now = Date.now();
      const connectionId = socket.id || "unknown";

      setConnectionState((prev) => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        connectionId,
        lastConnectTime: now,
        reconnectAttempt: 0,
      }));

      // Check if this was a reconnection
      setConnectionState((prevState) => {
        const wasReconnecting =
          prevState.isReconnecting ||
          (disconnectStartTime.current &&
            now - disconnectStartTime.current > 1000);

        if (wasReconnecting && disconnectStartTime.current) {
          const reconnectTime = now - disconnectStartTime.current;
          reconnectTimes.current.push(reconnectTime);
          // Keep only last 20 reconnect times
          reconnectTimes.current = reconnectTimes.current.slice(-20);

          addConnectionEvent({
            type: "reconnect",
            timestamp: now,
            duration: reconnectTime,
            data: { connectionId, reconnectTime },
          });

          logConnection(`Reconnected after ${reconnectTime}ms`, {
            connectionId,
            reconnectTime,
            browser: getBrowserDescription(browserInfo),
          });
        } else {
          addConnectionEvent({
            type: "connect",
            timestamp: now,
            data: { connectionId },
          });

          logConnection("Initial connection established", {
            connectionId,
            browser: getBrowserDescription(browserInfo),
          });
        }

        return {
          ...prevState,
          isConnected: true,
          isReconnecting: false,
          connectionId,
          lastConnectTime: now,
          reconnectAttempt: 0,
        };
      });

      disconnectStartTime.current = null;
    };

    // Connection lost
    const handleDisconnect = (reason: string) => {
      const now = Date.now();

      setConnectionState((prev) => ({
        ...prev,
        isConnected: false,
        isReconnecting: reason === "io server disconnect" ? false : true,
        lastDisconnectTime: now,
      }));

      disconnectStartTime.current = now;

      setConnectionState((prevState) => {
        addConnectionEvent({
          type: "disconnect",
          timestamp: now,
          data: { reason, connectionId: prevState.connectionId },
        });

        logConnection(`Disconnected: ${reason}`, {
          reason,
          connectionId: prevState.connectionId,
          browser: getBrowserDescription(browserInfo),
        });

        return {
          ...prevState,
          isConnected: false,
          isReconnecting: reason === "io server disconnect" ? false : true,
          lastDisconnectTime: now,
        };
      });
    };

    // Connection error
    const handleConnectError = (error: Error) => {
      const now = Date.now();

      setConnectionState((prev) => {
        const newAttempt = prev.reconnectAttempt + 1;

        addConnectionEvent({
          type: "connect_error",
          timestamp: now,
          data: {
            error: error.message,
            attempt: newAttempt,
          },
        });

        logError(`Connection error (attempt ${newAttempt})`, {
          error: error.message,
          browser: getBrowserDescription(browserInfo),
        });

        return {
          ...prev,
          reconnectAttempt: newAttempt,
        };
      });
    };

    // Transport change (WebSocket vs Polling)
    const handleTransportChange = (transport: string) => {
      setConnectionState((prev) => ({
        ...prev,
        transport,
      }));

      setConnectionMetrics((prev) => ({
        ...prev,
        currentTransport: transport,
        transportHistory: [...prev.transportHistory.slice(-9), transport], // Keep last 10
      }));

      addConnectionEvent({
        type: "transport_change",
        timestamp: Date.now(),
        data: { transport },
      });

      logConnection(`Transport changed to: ${transport}`, {
        transport,
        browser: getBrowserDescription(browserInfo),
      });
    };

    // Attach listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    // Monitor transport changes
    if (socket.io && socket.io.engine) {
      socket.io.engine.on("upgrade", () => {
        handleTransportChange(socket.io?.engine?.transport?.name || "unknown");
      });

      socket.io.engine.on("upgradeError", () => {
        logConnection("Transport upgrade failed, staying on polling", {
          browser: getBrowserDescription(browserInfo),
        });
      });
    }

    // Initial transport detection
    const initialTransport = socket.io?.engine?.transport?.name || "unknown";
    if (initialTransport !== "unknown") {
      handleTransportChange(initialTransport);
    }

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [socket, enabled, browserInfo, addConnectionEvent]);

  // Update metrics when events change
  useEffect(() => {
    setConnectionMetrics((prev) => {
      const events = connectionEvents;
      const connections = events.filter((e) => e.type === "connect").length;
      const disconnections = events.filter(
        (e) => e.type === "disconnect"
      ).length;
      const reconnections = events.filter((e) => e.type === "reconnect").length;
      const errors = events.filter((e) => e.type === "connect_error").length;

      // Calculate average reconnection time
      const avgReconnectTime =
        reconnectTimes.current.length > 0
          ? reconnectTimes.current.reduce((a, b) => a + b, 0) /
            reconnectTimes.current.length
          : 0;

      // Calculate longest disconnection
      const disconnectEvents = events.filter((e) => e.type === "disconnect");
      const longestDisconnection = disconnectEvents.reduce((max, event) => {
        return Math.max(max, event.duration || 0);
      }, 0);

      // Determine connection quality based on metrics
      let connectionQuality: ConnectionMetrics["connectionQuality"] = "unknown";

      if (connections > 0) {
        const reconnectRate = reconnections / connections;
        const errorRate = errors / connections;

        if (
          reconnectRate < 0.1 &&
          errorRate < 0.05 &&
          avgReconnectTime < 3000
        ) {
          connectionQuality = "excellent";
        } else if (
          reconnectRate < 0.3 &&
          errorRate < 0.15 &&
          avgReconnectTime < 8000
        ) {
          connectionQuality = "good";
        } else {
          connectionQuality = "poor";
        }
      }

      return {
        ...prev,
        totalConnections: connections,
        totalDisconnections: disconnections,
        totalReconnections: reconnections,
        totalErrors: errors,
        averageReconnectTime: avgReconnectTime,
        longestDisconnection,
        connectionQuality,
      };
    });
  }, [connectionEvents]);

  // Performance monitoring - log slow operations
  const logSlowOperation = useCallback(
    (operation: string, duration: number, threshold = 1000) => {
      if (duration > threshold) {
        logPerformance(`Slow ${operation}: ${duration}ms`, {
          operation,
          duration,
          threshold,
          browser: getBrowserDescription(browserInfo),
        });
      }
    },
    [browserInfo]
  );

  // Get connection quality indicator
  const getConnectionQualityColor = useCallback((): string => {
    switch (connectionMetrics.connectionQuality) {
      case "excellent":
        return "#10b981"; // green
      case "good":
        return "#f59e0b"; // yellow
      case "poor":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  }, [connectionMetrics.connectionQuality]);

  return {
    // State
    connectionState,
    connectionMetrics,
    connectionEvents: connectionEvents.slice(-20), // Return only recent events
    browserInfo,

    // Utilities
    logSlowOperation,
    getConnectionQualityColor,

    // Debug methods
    exportConnectionData: () => ({
      browserInfo: getBrowserDescription(browserInfo),
      connectionState,
      connectionMetrics,
      recentEvents: connectionEvents.slice(-50),
      timestamp: new Date().toISOString(),
    }),
  };
}
