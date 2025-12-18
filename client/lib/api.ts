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

  //console.log("Is Login or Register? ", isLoginOrRegister);

  // Always include credentials for cross-origin requests (needed for network IP access)
  const shouldIncludeCredentials =
    isLoginOrRegister ||
    path.match(/^\/auth\/refresh$/) ||
    Boolean(accessToken); // Include credentials for all authenticated requests

  return {
    mode: "cors",
    // Include credentials for cross-origin requests to support cookies
    credentials: shouldIncludeCredentials ? "include" : undefined,
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

  // Mobile debugging - log request details
  /*
  console.log("📡 API Request:", {
    url,
    method: init.method || "GET",
    mobile: /iPhone|iPad|Android/i.test(navigator.userAgent),
    timestamp: new Date().toISOString(),
  });*/

  const res = await fetch(url, buildInit(path, init));

  // Mobile debugging - log response details
  /*
  console.log("📡 API Response:", {
    url,
    status: res.status,
    ok: res.ok,
    headers: Object.fromEntries(res.headers.entries()),
  });*/

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
  // Profile image upload
  uploadAvatar: async (
    file: File
  ): Promise<{
    message: string;
    urls: {
      fullSize: {
        direct: string;
        presigned: string;
      };
      small: {
        direct: string;
        presigned: string;
      };
    };
    metadata: {
      originalName: string;
      size: number;
      mimeType: string;
      dimensions: {
        width: number;
        height: number;
      };
    };
  }> => {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await request("/auth/profile/avatar", {
      method: "POST",
      body: formData, // FormData handles Content-Type automatically
    });

    return response.json();
  },
  uploadBanner: async (
    file: File
  ): Promise<{
    message: string;
    urls: {
      fullSize: {
        direct: string;
        presigned: string;
      };
      small: {
        direct: string;
        presigned: string;
      };
    };
    metadata: {
      originalName: string;
      size: number;
      mimeType: string;
      dimensions: {
        width: number;
        height: number;
      };
    };
  }> => {
    const formData = new FormData();
    formData.append("banner", file);

    const response = await request("/auth/profile/banner", {
      method: "POST",
      body: formData, // FormData handles Content-Type automatically
    });

    return response.json();
  },
  // Profile update
  updateProfile: async (profileData: {
    name?: string;
    dob?: string;
    gender?: "male" | "female" | "other" | "";
    phone?: {
      countryCode: string;
      number: string;
    };
  }): Promise<{
    success: boolean;
    message: string;
    user?: {
      id: string;
      name: string;
      email: string;
      dob?: string;
      gender?: string;
      phone?: {
        countryCode: string;
        number: string;
      };
      groups: string[];
      avatar?: {
        fullSize?: string | null;
        small?: string | null;
      };
      banner?: {
        fullSize?: string | null;
        small?: string | null;
      };
      avatarUrl?: string;
      bannerUrl?: string;
    };
    errors?: Array<{
      field: string;
      message: string;
    }>;
  }> => {
    const response = await request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });

    return response.json();
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
    body: {
      name?: string;
      description?: string;
      type?: string;
      customization?: {
        headerImage?: {
          source: "preset" | "custom";
          value: string;
        };
        accentColor?: {
          preset: string;
          hex: string;
        };
      };
    }
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
    creatorMessage?: string;
    rsvpDeadline?: string;
    dressCode?: string;
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
      creatorMessage?: string;
      rsvpDeadline?: string;
      dressCode?: string;
      status?: "draft" | "published" | "cancelled" | "completed";
      customization?: {
        headerImage?: {
          source: "preset" | "custom";
          value: string;
        };
        accentColor?: {
          preset: string;
          hex: string;
        };
      };
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

// TASK MANAGEMENT: Task API endpoints
export const TasksAPI = {
  // Get all tasks with filtering and pagination
  getAll: (params?: {
    groupId?: string;
    eventId?: string;
    status?: string;
    priority?: string;
    category?: string;
    assignedToMe?: boolean;
    createdByMe?: boolean;
    dueDate?: string;
    isOverdue?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.groupId) searchParams.append("groupId", params.groupId);
    if (params?.eventId) searchParams.append("eventId", params.eventId);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.priority) searchParams.append("priority", params.priority);
    if (params?.category) searchParams.append("category", params.category);
    if (params?.assignedToMe) searchParams.append("assignedToMe", "true");
    if (params?.createdByMe) searchParams.append("createdByMe", "true");
    if (params?.dueDate) searchParams.append("dueDate", params.dueDate);
    if (params?.isOverdue) searchParams.append("isOverdue", "true");
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const queryString = searchParams.toString();
    const path = queryString ? `/tasks?${queryString}` : "/tasks";
    return request(path).then((r) => r.json());
  },

  // Get specific task by ID
  getById: (taskId: string) =>
    request(`/tasks/${taskId}`).then((r) => r.json()),

  // Create a new task
  create: (body: {
    title: string;
    description?: string;
    groupId?: string;
    eventId?: string;
    assigneeIds?: string[];
    priority: string;
    category: string;
    dueDate?: string;
    allowSelfAssign: boolean;
    requiresVerification: boolean;
  }) =>
    request("/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Update an existing task
  update: (
    taskId: string,
    body: {
      title?: string;
      description?: string;
      priority?: string;
      category?: string;
      dueDate?: string | null;
      allowSelfAssign?: boolean;
      requiresVerification?: boolean;
      status?: string;
      blockReason?: string;
    }
  ) =>
    request(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Delete a task
  delete: (taskId: string) =>
    request(`/tasks/${taskId}`, {
      method: "DELETE",
    }).then((r) => r.json()),

  // Assign/unassign users to a task
  assign: (taskId: string, body: { assigneeIds: string[] }) =>
    request(`/tasks/${taskId}/assign`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Update task status
  updateStatus: (
    taskId: string,
    body: {
      status: string;
      comment?: string;
      blockReason?: string;
    }
  ) =>
    request(`/tasks/${taskId}/status`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Add comment to task
  addComment: (taskId: string, body: { content: string }) =>
    request(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Get tasks for a specific group
  getByGroup: (
    groupId: string,
    params?: { status?: string; priority?: string }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.priority) searchParams.append("priority", params.priority);

    const queryString = searchParams.toString();
    const path = queryString
      ? `/tasks/group/${groupId}?${queryString}`
      : `/tasks/group/${groupId}`;
    return request(path).then((r) => r.json());
  },

  // Get tasks for a specific event
  getByEvent: (
    eventId: string,
    params?: { status?: string; priority?: string }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.priority) searchParams.append("priority", params.priority);

    const queryString = searchParams.toString();
    const path = queryString
      ? `/tasks/event/${eventId}?${queryString}`
      : `/tasks/event/${eventId}`;
    return request(path).then((r) => r.json());
  },
};

// EVENT COMMENTS API: Event comment management endpoints
export const EventCommentsAPI = {
  // Get all comments for an event with threading
  getByEvent: (eventId: string, params?: { limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const queryString = searchParams.toString();
    const path = queryString
      ? `/event-comments/${eventId}?${queryString}`
      : `/event-comments/${eventId}`;
    return request(path).then((r) => r.json());
  },

  // Create a new comment or reply
  create: (
    eventId: string,
    body: {
      content: string;
      parentCommentId?: string;
    }
  ) =>
    request(`/event-comments/${eventId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Update a comment (author only)
  update: (commentId: string, body: { content: string }) =>
    request(`/event-comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  // Delete a comment (soft delete)
  delete: (commentId: string) =>
    request(`/event-comments/${commentId}`, {
      method: "DELETE",
    }).then((r) => r.json()),

  // Toggle like on a comment
  toggleLike: (commentId: string) =>
    request(`/event-comments/${commentId}/like`, {
      method: "PATCH",
    }).then((r) => r.json()),

  // Get comment count for an event
  getCount: (eventId: string) =>
    request(`/event-comments/${eventId}/count`).then((r) => r.json()),
};
