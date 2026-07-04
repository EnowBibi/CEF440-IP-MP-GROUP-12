import { apiPost } from "@/lib/api-client";
import type { AuthenticationResponse } from "@/lib/types";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** POST /auth/authenticate — returns tokens + the user. */
export function login(
  email: string,
  password: string,
): Promise<AuthenticationResponse> {
  return apiPost<AuthenticationResponse>(
    "/auth/authenticate",
    { email, password },
    false,
  );
}

/** POST /auth/register — creates the account (no body returned). */
export function register(payload: RegisterPayload): Promise<void> {
  return apiPost<void>("/auth/register", payload, false);
}
