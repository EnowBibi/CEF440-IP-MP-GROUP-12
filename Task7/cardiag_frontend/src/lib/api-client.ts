import { API_BASE_URL } from "./config";
import { deleteItem, getItem, setItem, StorageKeys } from "./storage";
import type { AuthenticationResponse } from "./types";

/** Error carrying the HTTP status so screens can branch on it (401, 404, ...). */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// In-memory cache of the tokens so we don't hit secure storage on every call.
let accessToken: string | null = null;
let refreshToken: string | null = null;
let hydrated = false;

/** Loads tokens from persistent storage once per app launch. */
export async function hydrateTokens(): Promise<void> {
  if (hydrated) return;
  accessToken = await getItem(StorageKeys.accessToken);
  refreshToken = await getItem(StorageKeys.refreshToken);
  hydrated = true;
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  accessToken = access;
  refreshToken = refresh;
  hydrated = true;
  await Promise.all([
    setItem(StorageKeys.accessToken, access),
    setItem(StorageKeys.refreshToken, refresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    deleteItem(StorageKeys.accessToken),
    deleteItem(StorageKeys.refreshToken),
  ]);
}

export function getAccessToken(): string | null {
  return accessToken;
}

interface RequestOptions {
  method?: string;
  /** JSON body — serialized automatically. Mutually exclusive with `form`. */
  body?: unknown;
  /** Multipart body for file uploads. */
  form?: FormData;
  /** Attach the bearer token (default true). Set false for login/register. */
  auth?: boolean;
  /** Internal: prevents infinite refresh recursion. */
  _retried?: boolean;
}

// Ensures concurrent 401s trigger only a single refresh round-trip.
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: "POST",
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        if (!res.ok) return false;
        const data = (await res.json()) as AuthenticationResponse;
        await setTokens(data.access_token, data.refresh_token);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function parseError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return res.statusText || `Request failed (${res.status})`;
    try {
      const json = JSON.parse(text);
      return json.message || json.error || text;
    } catch {
      return text;
    }
  } catch {
    return res.statusText || `Request failed (${res.status})`;
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, form, auth = true, _retried = false } = options;

  if (auth && !hydrated) await hydrateTokens();

  const headers: Record<string, string> = {};
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  // NOTE: never set Content-Type for FormData — fetch adds the multipart boundary.

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  // Transparently refresh once on an expired access token, then retry.
  if (res.status === 401 && auth && !_retried) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...options, _retried: true });
    }
    await clearTokens();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  // 204 No Content (and other empty bodies) — nothing to parse.
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const apiGet = <T>(path: string, auth = true) =>
  request<T>(path, { method: "GET", auth });

export const apiPost = <T>(path: string, body?: unknown, auth = true) =>
  request<T>(path, { method: "POST", body, auth });

export const apiPut = <T>(path: string, body?: unknown, auth = true) =>
  request<T>(path, { method: "PUT", body, auth });

export const apiDelete = <T>(path: string, auth = true) =>
  request<T>(path, { method: "DELETE", auth });

export const apiPostForm = <T>(path: string, form: FormData, auth = true) =>
  request<T>(path, { method: "POST", form, auth });
