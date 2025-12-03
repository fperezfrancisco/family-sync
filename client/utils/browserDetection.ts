/**
 * Browser Detection and Configuration Utilities
 *
 * Detects browser types and provides optimal Socket.IO configurations
 * for different browsers, especially mobile browsers that have different
 * network handling behaviors.
 */

export interface BrowserInfo {
  name: "chrome" | "safari" | "firefox" | "edge" | "unknown";
  isMobile: boolean;
  isChromeMobile: boolean;
  isSafariMobile: boolean;
  version: string;
  platform: "ios" | "android" | "desktop" | "unknown";
}

export interface SocketConfig {
  transports: ("websocket" | "polling")[];
  upgrade: boolean;
  rememberUpgrade: boolean;
  timeout: number;
  reconnectionDelay: number;
  reconnectionDelayMax: number;
  maxReconnectionAttempts: number;
  randomizationFactor: number;
}

export interface MessageStrategy {
  optimisticUpdates: boolean;
  persistToStorage: boolean;
  aggressiveRetry: boolean;
  connectionHealthCheck: boolean;
  queueOfflineMessages: boolean;
}

/**
 * Detect browser information from User Agent
 */
export function detectBrowser(): BrowserInfo {
  // Return default values during server-side rendering
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      name: "unknown",
      isMobile: false,
      isChromeMobile: false,
      isSafariMobile: false,
      version: "unknown",
      platform: "unknown",
    };
  }

  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /Mobi|Android/i.test(userAgent);

  let name: BrowserInfo["name"] = "unknown";
  let version = "unknown";
  let platform: BrowserInfo["platform"] = "unknown";

  // Detect browser name and version
  if (userAgent.includes("Chrome") && !userAgent.includes("Edge")) {
    name = "chrome";
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    version = match ? match[1] : "unknown";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    name = "safari";
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    version = match ? match[1] : "unknown";
  } else if (userAgent.includes("Firefox")) {
    name = "firefox";
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    version = match ? match[1] : "unknown";
  } else if (userAgent.includes("Edge")) {
    name = "edge";
    const match = userAgent.match(/Edge\/(\d+\.\d+)/);
    version = match ? match[1] : "unknown";
  }

  // Detect platform
  if (isIOS) {
    platform = "ios";
  } else if (isAndroid) {
    platform = "android";
  } else if (!isMobile) {
    platform = "desktop";
  }

  const isChromeMobile = name === "chrome" && isMobile;
  const isSafariMobile = name === "safari" && isIOS;

  return {
    name,
    isMobile,
    isChromeMobile,
    isSafariMobile,
    version,
    platform,
  };
}

/**
 * Get optimal Socket.IO configuration for the detected browser
 */
export function getOptimalSocketConfig(browserInfo: BrowserInfo): SocketConfig {
  const baseConfig: SocketConfig = {
    transports: ["websocket", "polling"],
    upgrade: true,
    rememberUpgrade: true,
    timeout: 20000,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: 5,
    randomizationFactor: 0.5,
  };

  // Chrome Mobile: More conservative settings
  if (browserInfo.isChromeMobile) {
    return {
      ...baseConfig,
      // Start with polling for reliability, upgrade to websocket if stable
      transports: ["polling", "websocket"],
      upgrade: true,
      rememberUpgrade: false, // Don't remember upgrade due to connection instability
      timeout: 30000, // Longer timeout for mobile networks
      reconnectionDelay: 2000, // Longer delay between attempts
      reconnectionDelayMax: 10000,
      maxReconnectionAttempts: 8, // More attempts due to frequent disconnections
      randomizationFactor: 0.3, // Less randomization for more predictable timing
    };
  }

  // Safari Mobile: Standard settings with some mobile optimizations
  if (browserInfo.isSafariMobile) {
    return {
      ...baseConfig,
      timeout: 25000,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 7500,
      maxReconnectionAttempts: 6,
    };
  }

  // Desktop browsers: Optimized for performance
  if (!browserInfo.isMobile) {
    return {
      ...baseConfig,
      timeout: 15000, // Shorter timeout for faster networks
      reconnectionDelay: 800,
      reconnectionDelayMax: 3000,
      maxReconnectionAttempts: 5,
      randomizationFactor: 0.5,
    };
  }

  // Other mobile browsers: Conservative approach
  return {
    ...baseConfig,
    transports: ["polling", "websocket"],
    timeout: 25000,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 8000,
    maxReconnectionAttempts: 7,
  };
}

/**
 * Get message handling strategy for the detected browser
 */
export function getBrowserSpecificStrategy(
  browserInfo: BrowserInfo
): MessageStrategy {
  // Chrome Mobile: Maximum reliability features
  if (browserInfo.isChromeMobile) {
    return {
      optimisticUpdates: true, // Still show immediate feedback
      persistToStorage: true, // Aggressively persist to localStorage
      aggressiveRetry: true, // Retry failed messages multiple times
      connectionHealthCheck: true, // Regular ping/pong checks
      queueOfflineMessages: true, // Queue messages when offline
    };
  }

  // Safari Mobile: Balanced approach
  if (browserInfo.isSafariMobile) {
    return {
      optimisticUpdates: true,
      persistToStorage: true,
      aggressiveRetry: false, // Less aggressive, Safari is more stable
      connectionHealthCheck: true,
      queueOfflineMessages: true,
    };
  }

  // Desktop: Performance optimized
  if (!browserInfo.isMobile) {
    return {
      optimisticUpdates: true,
      persistToStorage: false, // Desktop doesn't need aggressive persistence
      aggressiveRetry: false,
      connectionHealthCheck: false, // Desktop connections are typically stable
      queueOfflineMessages: false, // Desktop users can refresh if needed
    };
  }

  // Other mobile: Conservative defaults
  return {
    optimisticUpdates: true,
    persistToStorage: true,
    aggressiveRetry: true,
    connectionHealthCheck: true,
    queueOfflineMessages: true,
  };
}

/**
 * Check if current browser is problematic for real-time features
 */
export function isProblematicBrowser(): boolean {
  const browser = detectBrowser();
  return browser.isChromeMobile;
}

/**
 * Get human-readable browser description for logging
 */
export function getBrowserDescription(browserInfo?: BrowserInfo): string {
  const info = browserInfo || detectBrowser();
  const mobileSuffix = info.isMobile ? " Mobile" : "";
  const platformSuffix =
    info.platform !== "unknown" ? ` (${info.platform})` : "";

  return `${info.name}${mobileSuffix} ${info.version}${platformSuffix}`;
}
