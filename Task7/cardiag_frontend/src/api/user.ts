import { apiGet, apiPostForm, apiPut } from "@/lib/api-client";
import type { UserResponse } from "@/lib/types";
import { appendFile, type UploadAsset } from "./files";

/** GET /users/me */
export function getMe(): Promise<UserResponse> {
  return apiGet<UserResponse>("/users/me");
}

/** PUT /users/me */
export function updateProfile(
  firstName: string,
  lastName: string,
): Promise<UserResponse> {
  return apiPut<UserResponse>("/users/me", { firstName, lastName });
}

/** POST /users/me/profile-picture (multipart) */
export async function uploadProfilePicture(
  asset: UploadAsset,
): Promise<UserResponse> {
  const form = new FormData();
  await appendFile(form, "file", asset);
  return apiPostForm<UserResponse>("/users/me/profile-picture", form);
}
