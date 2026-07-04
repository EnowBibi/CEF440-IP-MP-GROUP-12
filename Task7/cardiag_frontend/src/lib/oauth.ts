import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { SERVER_ORIGIN } from "./config";

export interface OAuthTokens {
  token: string;
  refreshToken: string;
}

function buildAuthUrl(redirectUri: string): string {
  return `${SERVER_ORIGIN}/oauth2/authorization/google?redirect_uri=${encodeURIComponent(
    redirectUri,
  )}`;
}

/**
 * Kicks off Google OAuth2 against the backend.
 *
 * - Web: full-page redirect to the backend, which sends the browser back to
 *   `/oauth2/redirect?token=…` (handled by the route of the same name). Returns
 *   null because navigation takes over.
 * - Native: opens an auth session that returns to the app's deep link with the
 *   tokens as query params, which we parse and return to the caller.
 */
export async function startGoogleSignIn(): Promise<OAuthTokens | null> {
  if (Platform.OS === "web") {
    const origin = globalThis.location?.origin ?? SERVER_ORIGIN;
    const redirectUri = `${origin}/oauth2/redirect`;
    globalThis.location.href = buildAuthUrl(redirectUri);
    return null;
  }

  const redirectUri = Linking.createURL("oauth2/redirect");
  const result = await WebBrowser.openAuthSessionAsync(
    buildAuthUrl(redirectUri),
    redirectUri,
  );

  if (result.type !== "success" || !result.url) {
    return null; // user dismissed / cancelled
  }

  return parseTokensFromUrl(result.url);
}

/** Extracts and validates the token params from a redirect URL. */
export function parseTokensFromUrl(url: string): OAuthTokens {
  const { queryParams } = Linking.parse(url);
  const token = queryParams?.token;
  const refreshToken = queryParams?.refreshToken;
  const error = queryParams?.error;

  if (typeof error === "string" && error) {
    throw new Error(error);
  }
  if (typeof token !== "string" || typeof refreshToken !== "string") {
    throw new Error("Google sign-in did not return valid tokens.");
  }
  return { token, refreshToken };
}
