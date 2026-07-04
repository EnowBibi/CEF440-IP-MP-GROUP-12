import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Cross-platform key/value storage for small secrets (auth tokens).
 *
 * `expo-secure-store` is not available on web, so we transparently fall back
 * to `localStorage` there. The API is intentionally tiny and async on every
 * platform so callers don't have to branch.
 */
const isWeb = Platform.OS === "web";

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* storage unavailable (e.g. private mode) — ignore */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const StorageKeys = {
  accessToken: "cardiag.accessToken",
  refreshToken: "cardiag.refreshToken",
} as const;
