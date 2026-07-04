/**
 * TypeScript mirrors of the Spring Boot DTOs. Field names match the JSON the
 * API actually emits (note the snake_case token fields on the auth response).
 */

export type Role = "USER" | "ADMIN";
export type OAuthProvider = "LOCAL" | "GOOGLE";
export type InputType = "IMAGE" | "AUDIO" | "TEXT";
export type ConfidenceLabel = "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  profilePictureUrl?: string | null;
  role: Role;
  oAuthProvider?: OAuthProvider | null;
  createdAt: string;
}

export interface AuthenticationResponse {
  access_token: string;
  refresh_token: string;
  user: UserResponse;
}

export interface VideoResult {
  videoId: string;
  title: string;
  channelName: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  videoUrl: string;
}

export interface DiagnosisResponse {
  faultId?: string | null;
  faultName?: string | null;
  category?: string | null;
  description?: string | null;
  urgency?: string | null;
  causes: string[];
  symptoms: string[];
  repairTips: string[];
  confidenceScore: number;
  confidenceLabel?: ConfidenceLabel | null;
  llmReport?: string | null;
  inputDescription?: string | null;
  videos: VideoResult[];
  recognised: boolean;
  message?: string | null;
}

export interface DiagnosisHistoryItem {
  id: number;
  faultId?: string | null;
  faultName?: string | null;
  category?: string | null;
  urgency?: string | null;
  inputType: InputType;
  confidenceScore?: number | null;
  confidenceLabel?: ConfidenceLabel | null;
  isLowConfidence?: boolean | null;
  recognised: boolean;
  createdAt: string;
}

export interface DiagnosisDetail {
  id: number;
  faultId?: string | null;
  faultName?: string | null;
  category?: string | null;
  description?: string | null;
  urgency?: string | null;
  causes?: string[] | null;
  symptoms?: string[] | null;
  repairTips?: string[] | null;
  inputType: InputType;
  imageDescription?: string | null;
  audioTranscription?: string | null;
  userText?: string | null;
  llmReport?: string | null;
  confidenceScore?: number | null;
  confidenceLabel?: ConfidenceLabel | null;
  isLowConfidence?: boolean | null;
  recognised: boolean;
  createdAt: string;
}
