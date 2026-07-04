import { Platform } from "react-native";

/**
 * Base origin of the Spring Boot server.
 *
 * - Web / iOS simulator can reach the host machine on `localhost`.
 * - The Android emulator reaches the host machine through the special `10.0.2.2` alias.
 * - Override either with `EXPO_PUBLIC_API_URL` (full base, e.g. http://192.168.1.20:8080)
 *   when testing on a physical device.
 */
const DEFAULT_ORIGIN =
  Platform.select({
    android: "http://10.0.2.2:8080",
    default: "http://localhost:8080",
  }) ?? "http://localhost:8080";

export const SERVER_ORIGIN = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_ORIGIN;

/** Versioned REST prefix every endpoint hangs off of. */
export const API_BASE_URL = `${SERVER_ORIGIN}/api/v1`;

/**
 * Resolves a (possibly relative) media path returned by the API into an
 * absolute URL the client can load.
 */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}
