import { apiDelete, apiGet, apiPostForm } from "@/lib/api-client";
import type {
  DiagnosisDetail,
  DiagnosisHistoryItem,
  DiagnosisResponse,
  VideoResult,
} from "@/lib/types";
import { appendFile, type UploadAsset } from "./files";

/** POST /diagnose with a free-text symptom description. */
export function diagnoseText(text: string): Promise<DiagnosisResponse> {
  const form = new FormData();
  form.append("inputType", "TEXT");
  form.append("text", text);
  return apiPostForm<DiagnosisResponse>("/diagnose", form);
}

/** POST /diagnose with a dashboard / warning-light photo. */
export async function diagnoseImage(
  asset: UploadAsset,
): Promise<DiagnosisResponse> {
  const form = new FormData();
  form.append("inputType", "IMAGE");
  await appendFile(form, "file", asset);
  return apiPostForm<DiagnosisResponse>("/diagnose", form);
}

/** POST /diagnose with an engine-sound recording. */
export async function diagnoseAudio(
  asset: UploadAsset,
): Promise<DiagnosisResponse> {
  const form = new FormData();
  form.append("inputType", "AUDIO");
  await appendFile(form, "file", asset);
  return apiPostForm<DiagnosisResponse>("/diagnose", form);
}

/**
 * GET /diagnoses?userId — past diagnoses, newest first.
 * The server replies 204 (→ undefined here) when there is no history.
 */
export async function getHistory(
  userId: number,
): Promise<DiagnosisHistoryItem[]> {
  const list = await apiGet<DiagnosisHistoryItem[] | undefined>(
    `/diagnoses?userId=${userId}`,
  );
  return list ?? [];
}

/** GET /diagnoses/{id} */
export function getDiagnosis(id: number): Promise<DiagnosisDetail> {
  return apiGet<DiagnosisDetail>(`/diagnoses/${id}`);
}

/** DELETE /diagnoses/{id} */
export function deleteDiagnosis(id: number): Promise<void> {
  return apiDelete<void>(`/diagnoses/${id}`);
}

/**
 * GET /videos/{faultId} — YouTube repair tutorials for a fault. Videos aren't
 * persisted with the diagnosis, so the result view fetches them on demand
 * (works for both live results and items reopened from history). 204 → [].
 */
export async function getVideosForFault(
  faultId: string,
): Promise<VideoResult[]> {
  const list = await apiGet<VideoResult[] | undefined>(
    `/videos/${encodeURIComponent(faultId)}`,
  );
  return list ?? [];
}
