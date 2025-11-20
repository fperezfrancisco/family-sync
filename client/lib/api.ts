const BASE = process.env.NEXT_PUBLIC_API_URL!;
if (!BASE) {
  console.error(
    "NEXT_PUBLIC_API_URL is not set. API calls will fail. Set NEXT_PUBLIC_API_URL in your environment."
  );
}

function buildInit(path: string, init: RequestInit = {}): RequestInit {
  const hasBody = typeof init.body !== "undefined" && init.body !== null;
  const headers = new Headers(init.headers || undefined);
  // Only set Content-Type for JSON bodies, not FormData
  if (
    hasBody &&
    !headers.has("Content-Type") &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  // Add Authorization header if accessToken exists
  // Exception: don't add auth header for login/register/refresh routes
  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const isPublicAuthPath = path.match(/^\/auth\/(login|register|refresh)$/);
  if (accessToken && !isPublicAuthPath) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // Check if this is a login or register route that needs to accept cookies
  const isLoginOrRegister = path.match(/^\/auth\/(login|register)$/);

  return {
    mode: "cors",
    // Include credentials for login/register to store refresh token cookie
    credentials: isLoginOrRegister ? "include" : undefined,
    ...init,
    headers,
  };
}

// Track refresh attempts to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Helper function to reset refresh state
function resetRefreshState() {
  isRefreshing = false;
  refreshPromise = null;
}

async function refreshAccessToken() {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  // Set the refreshing flag and create the promise
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      // Make direct fetch call to avoid recursion through request()
      const url = `${BASE}/auth/refresh`;
      const res = await fetch(url, {
        method: "POST",
        mode: "cors",
        credentials: "include", // Essential for sending cookies
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Refresh failed: ${res.status}`);
      }

      const data = await res.json();
      const newAccessToken = data.accessToken;

      if (!newAccessToken) {
        throw new Error("No access token received from refresh");
      }

      // Store the new access token
      localStorage.setItem("accessToken", newAccessToken);
      localStorage.setItem("refreshExists", "true");
      return newAccessToken;
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      // Clear stored token on refresh failure
      localStorage.removeItem("accessToken");
      //localStorage.removeItem("refreshExists");
      throw error;
    } finally {
      // Reset refresh state
      resetRefreshState();
    }
  })();

  return refreshPromise;
}

async function request(path: string, init: RequestInit = {}, retryCount = 0) {
  const url = `${BASE}${path}`;
  // Helpful debug: print the full URL in dev when debugging 404s
  if (typeof window !== "undefined" && (!BASE || BASE.indexOf("http") !== 0)) {
    console.warn("API base URL may be misconfigured:", BASE, "full path:", url);
  }

  const res = await fetch(url, buildInit(path, init));

  // Handle 401 (Unauthorized) - attempt token refresh
  if (
    res.status === 401 &&
    !path.match(/^\/auth\/(login|register|refresh)$/) &&
    retryCount === 0
  ) {
    try {
      //console.log("Access token expired, attempting refresh...");
      await refreshAccessToken();
      //console.log("Token refreshed successfully, retrying request");
      // Retry the original request with new token (only once)
      return request(path, init, 1);
    } catch (refreshError) {
      console.error("Token refresh failed:", refreshError);

      // Clear any stored tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshExists");

      // Only redirect if we're in a browser environment
      if (typeof window !== "undefined") {
        // Give user feedback before redirect
        console.log("Session expired. Redirecting to login...");

        // Small delay to let any pending operations complete
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 100);
      }

      // Re-throw the original error for proper error handling
      throw refreshError;
    }
  }

  if (!res.ok) {
    let msg = "Request failed";
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {
      // Ignore JSON parsing errors for error messages
    }
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return res;
}

export const AuthAPI = {
  me: () => request("/auth/me").then((r) => r.json()),
  register: (body: { name: string; email: string; password: string }) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  login: (body: { email: string; password: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(body) }).then(
      (r) => r.json()
    ),
  logout: async () => {
    try {
      // Call backend logout to revoke refresh token
      await request("/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies for refresh token
      });
    } catch (error) {
      console.error("Logout request failed:", error);
      // Continue with local cleanup even if backend call fails
    } finally {
      // Always clear local storage
      localStorage.removeItem("accessToken");

      // Reset refresh state on logout
      resetRefreshState();
    }
  },
};

export const GroupsAPI = {
  getMine: () => request("/groups/").then((r) => r.json()),
  getById: (groupId: string) =>
    request(`/groups/${groupId}`).then((r) => r.json()),
  create: (body: { name: string; description?: string; type: string }) =>
    request("/groups/", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  editGroup: (
    groupId: string,
    body: { name?: string; description?: string; type?: string }
  ) =>
    request(`/groups/${groupId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteGroup: (groupId: string) =>
    request(`/groups/${groupId}`, {
      method: "DELETE",
    }),
  addMember: (groupId: string, body: { userId: string; role: string }) =>
    request(`/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  removeMember: (groupId: string, memberId: string) =>
    request(`/groups/${groupId}/members/${memberId}`, {
      method: "DELETE",
    }),
  updateMemberRole: (
    groupId: string,
    memberId: string,
    body: { role: string }
  ) =>
    request(`/groups/${groupId}/members/${memberId}/role`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  getGroupMembers: (groupId: string) =>
    request(`/groups/${groupId}/members`).then((r) => r.json()),

  // INVITATION SYSTEM: Group invitation management
  createInvitation: (
    groupId: string,
    body: {
      email: string;
      message?: string;
      role?: "admin" | "member" | "guest";
    }
  ) =>
    request(`/groups/${groupId}/invitations`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  getInvitations: (groupId: string, status?: string) => {
    const path = status
      ? `/groups/${groupId}/invitations?status=${status}`
      : `/groups/${groupId}/invitations`;
    return request(path).then((r) => r.json());
  },

  cancelInvitation: (groupId: string, invitationId: string) =>
    request(`/groups/${groupId}/invitations/${invitationId}`, {
      method: "DELETE",
    }).then((r) => r.json()),
};

export const EventsAPI = {
  // Get all events for authenticated user with optional filtering
  getAll: (params?: {
    startDate?: string;
    endDate?: string;
    groupId?: string;
    status?: "draft" | "published" | "cancelled" | "completed" | "all";
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.groupId) searchParams.append("groupId", params.groupId);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const queryString = searchParams.toString();
    const path = queryString ? `/events?${queryString}` : "/events";
    return request(path).then((r) => r.json());
  },

  // Get specific event by ID
  getById: (eventId: string) =>
    request(`/events/${eventId}`).then((r) => r.json()),

  // Create a new event
  create: (body: {
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    isAllDay?: boolean;
    timezone?: string;
    location?: string;
    locationUrl?: string;
    isVirtual?: boolean;
    group?: { id: string; name?: string; type?: string };
    isPrivate?: boolean;
    allowGuestInvites?: boolean;
    requireRSVP?: boolean;
    maxAttendees?: number;
    inviteUserIds?: string[];
  }) =>
    request("/events", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Update an existing event (owner only)
  update: (
    eventId: string,
    body: {
      name?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      isAllDay?: boolean;
      timezone?: string;
      location?: string;
      locationUrl?: string;
      isVirtual?: boolean;
      isPrivate?: boolean;
      allowGuestInvites?: boolean;
      requireRSVP?: boolean;
      maxAttendees?: number;
      status?: "draft" | "published" | "cancelled" | "completed";
    }
  ) =>
    request(`/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Delete an event (owner only)
  delete: (eventId: string) =>
    request(`/events/${eventId}`, {
      method: "DELETE",
    }).then((r) => r.json()),

  // RSVP to an event
  rsvp: (
    eventId: string,
    body: { status: "attending" | "not_attending" | "maybe" }
  ) =>
    request(`/events/${eventId}/rsvp`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Invite users to an event (owner only)
  inviteUsers: (eventId: string, body: { userIds: string[] }) =>
    request(`/events/${eventId}/invite`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Get events for a specific group
  getByGroup: (groupId: string) =>
    request(`/events/group/${groupId}`).then((r) => r.json()),
};

// INVITATION SYSTEM: User invitation management
export const InvitationsAPI = {
  // Get current user's pending invitations
  getMine: () => request("/invitations/me").then((r) => r.json()),

  // Get invitation details
  getById: (invitationId: string) =>
    request(`/invitations/${invitationId}`).then((r) => r.json()),

  // Respond to an invitation
  respond: (
    invitationId: string,
    body: {
      action: "accept" | "decline";
      message?: string;
    }
  ) =>
    request(`/invitations/${invitationId}/respond`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.json()),
};
