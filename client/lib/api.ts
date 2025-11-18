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
  logout: () => {},
};
