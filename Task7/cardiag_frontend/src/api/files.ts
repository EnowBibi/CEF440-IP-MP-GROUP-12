import { Platform } from "react-native";

/** Minimal shape shared by image-picker assets and audio recordings. */
export interface UploadAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

/**
 * Appends a local file to a FormData in a way that works on both native and web.
 *
 * On native, React Native's fetch understands the `{ uri, name, type }` object.
 * On web, that object is meaningless — we must resolve the uri to a real Blob first.
 */
export async function appendFile(
  form: FormData,
  field: string,
  asset: UploadAsset,
): Promise<void> {
  const name = asset.fileName ?? guessName(asset);
  const type = asset.mimeType ?? "application/octet-stream";

  if (Platform.OS === "web") {
    const blob = await (await fetch(asset.uri)).blob();
    form.append(field, blob, name);
  } else {
    // React Native FormData file descriptor.
    form.append(field, { uri: asset.uri, name, type } as unknown as Blob);
  }
}

function guessName(asset: UploadAsset): string {
  if (asset.mimeType?.startsWith("image/")) {
    return `upload.${asset.mimeType.split("/")[1] ?? "jpg"}`;
  }
  if (asset.mimeType?.startsWith("audio/")) {
    return `upload.${asset.mimeType.split("/")[1] ?? "m4a"}`;
  }
  return "upload";
}
