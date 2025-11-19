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

  return {
    mode: "cors",
    // No credentials: 'include' – we're using Bearer now
    ...init,
    headers,
  };
}

async function refreshAccessToken() {
  try {
    // Call the refresh endpoint
    const res = await request("/auth/refresh", {
      method: "POST",
      // Include credentials for cookie-based refresh token
      credentials: "include",
    });

    const data = await res.json();
    const newAccessToken = data.accessToken;
    // Store the new access token
    localStorage.setItem("accessToken", newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error("Failed to refresh access token", error);
    throw error;
  }
}

async function request(path: string, init: RequestInit = {}) {
  const url = `${BASE}${path}`;
  // Helpful debug: print the full URL in dev when debugging 404s
  if (typeof window !== "undefined" && (!BASE || BASE.indexOf("http") !== 0)) {
    // eslint-disable-next-line no-console
    console.warn("API base URL may be misconfigured:", BASE, "full path:", url);
  }
  const res = await fetch(url, buildInit(path, init));

  if (res.status === 401 && !path.match(/^\/auth\/(login|register|refresh)$/)) {
    try {
      await refreshAccessToken();
      return request(path, init);
    } catch (error) {
      localStorage.removeItem("accessToken");
      window.location.href = "/auth/login";
      // If refresh also fails, propagate the original 401 error
      throw error;
    }
  }

  if (!res.ok) {
    let msg = "Request failed";
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {}
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
  logout: () => {
    //request("/auth/logout", { method: "POST" });
    localStorage.removeItem("accessToken");
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
