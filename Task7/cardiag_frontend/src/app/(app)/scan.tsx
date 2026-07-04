import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { diagnoseAudio, diagnoseImage, diagnoseText } from "@/api/diagnosis";
import type { UploadAsset } from "@/api/files";
import {
  DiagnosisResultView,
  type DiagnosisResultData,
} from "@/components/diagnosis-result";
import { useFeedback } from "@/components/feedback";
import { ApiError } from "@/lib/api-client";
import { BottomTabInset, Palette, Radius, Spacing } from "@/constants/theme";

type Mode = "text" | "photo" | "audio";
type IconName = React.ComponentProps<typeof Ionicons>["name"];

const MODES: { key: Mode; label: string; icon: IconName }[] = [
  { key: "text", label: "Describe", icon: "create-outline" },
  { key: "photo", label: "Scan", icon: "scan-outline" },
  { key: "audio", label: "Listen", icon: "mic-outline" },
];

const MODE_TITLE: Record<Mode, string> = {
  text: "Describe the problem",
  photo: "Scan warning light",
  audio: "Engine sound check",
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Decorative equalizer bars flanking the mic during recording. */
function Waveform({ active }: { active: boolean }) {
  const heights = [10, 18, 28, 16, 24, 12];
  return (
    <View style={styles.waveform}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={[
            styles.waveBar,
            { height: active ? h : 6, opacity: active ? 1 : 0.4 },
          ]}
        />
      ))}
    </View>
  );
}

export default function ScanScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { toast } = useFeedback();
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [image, setImage] = useState<UploadAsset | null>(null);
  const [audio, setAudio] = useState<UploadAsset | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResultData | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Deep-link: /scan?mode=photo|audio from the dashboard quick actions.
  useEffect(() => {
    if (params.mode === "photo" || params.mode === "audio") {
      setMode(params.mode);
    }
  }, [params.mode]);

  // Recording elapsed timer.
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  const reset = () => {
    setResult(null);
    setText("");
    setImage(null);
    setAudio(null);
    setElapsed(0);
  };

  const pickImage = async (fromCamera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.7,
    };
    const res =
      fromCamera && Platform.OS !== "web"
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    setImage({ uri: a.uri, fileName: a.fileName, mimeType: a.mimeType });
  };

  const startRecording = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        toast({
          type: "error",
          message: "Allow microphone access to record engine sounds.",
        });
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setAudio(null);
      setElapsed(0);
      setIsRecording(true);
    } catch {
      toast({ type: "error", message: "Recording isn't available on this device." });
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      setIsRecording(false);
      if (recorder.uri) {
        setAudio({ uri: recorder.uri, fileName: "engine.m4a", mimeType: "audio/m4a" });
      }
    } catch {
      setIsRecording(false);
    }
  };

  // Pick an existing audio file from the device/computer (same idea as the
  // photo gallery picker) and submit it for diagnosis.
  const pickAudioFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    setAudio({
      uri: a.uri,
      fileName: a.name,
      mimeType: a.mimeType ?? "audio/mpeg",
    });
    setElapsed(0);
  };

  const canSubmit =
    (mode === "text" && text.trim().length > 0) ||
    (mode === "photo" && !!image) ||
    (mode === "audio" && !!audio);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);
    try {
      let res: DiagnosisResultData;
      if (mode === "text") res = await diagnoseText(text.trim());
      else if (mode === "photo") res = await diagnoseImage(image!);
      else res = await diagnoseAudio(audio!);
      setResult(res);
    } catch (err) {
      toast({
        type: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "Something went wrong. Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{result ? "Diagnosis" : MODE_TITLE[mode]}</Text>
          {!result && (
            <Text style={styles.subtitle}>
              {mode === "photo"
                ? "Frame the dashboard warning light and capture it."
                : mode === "audio"
                  ? "Record the engine so we can listen for faults."
                  : "Tell us what's happening with your car."}
            </Text>
          )}
        </View>

        {result ? (
          <View style={styles.resultWrap}>
            <DiagnosisResultView data={result} />
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={reset}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={18} color={Palette.primary} />
              <Text style={styles.secondaryButtonText}>New diagnosis</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Mode selector */}
            <View style={styles.segment}>
              {MODES.map((m) => {
                const active = mode === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[styles.segmentItem, active && styles.segmentItemActive]}
                    onPress={() => setMode(m.key)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={m.icon}
                      size={18}
                      color={active ? Palette.onPrimary : Palette.textMuted}
                    />
                    <Text
                      style={[styles.segmentLabel, active && styles.segmentLabelActive]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* TEXT */}
            {mode === "text" && (
              <View style={styles.card}>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g. The engine shakes at idle and the check engine light is flashing."
                  placeholderTextColor={Palette.placeholder}
                  value={text}
                  onChangeText={setText}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}

            {/* PHOTO — warning light scanner */}
            {mode === "photo" && (
              <>
                <View style={styles.viewfinder}>
                  {image ? (
                    <Image source={{ uri: image.uri }} style={styles.viewfinderImage} />
                  ) : (
                    <View style={styles.viewfinderInner}>
                      <Ionicons name="warning" size={56} color="#FF7A1A" />
                      <Text style={styles.viewfinderText}>
                        Position the dashboard warning{"\n"}light inside the frame
                      </Text>
                    </View>
                  )}
                  {/* corner brackets */}
                  <View style={[styles.bracket, styles.bracketTL]} />
                  <View style={[styles.bracket, styles.bracketTR]} />
                  <View style={[styles.bracket, styles.bracketBL]} />
                  <View style={[styles.bracket, styles.bracketBR]} />
                </View>

                <View style={styles.cameraControls}>
                  <View style={styles.controlSide}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => setImage(null)}
                      disabled={!image}
                    >
                      <Ionicons
                        name="refresh"
                        size={22}
                        color={image ? "#fff" : "#3a4060"}
                      />
                    </TouchableOpacity>
                    <Text style={styles.controlLabel}>Retake</Text>
                  </View>

                  <View style={styles.controlSide}>
                    <TouchableOpacity
                      style={styles.shutterButton}
                      onPress={() => pickImage(true)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="camera" size={28} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.controlSide}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => pickImage(false)}
                    >
                      <Ionicons name="images" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.controlLabel}>Gallery</Text>
                  </View>
                </View>

                {!!image && (
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={18} color={Palette.onPrimary} />
                        <Text style={styles.submitText}>Run diagnosis</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* AUDIO — engine sound recorder */}
            {mode === "audio" && (
              <View style={styles.recorder}>
                <View style={styles.micRow}>
                  <Waveform active={isRecording} />
                  <View
                    style={[styles.micCircle, isRecording && styles.micCircleActive]}
                  >
                    <Ionicons name="mic" size={40} color="#fff" />
                  </View>
                  <Waveform active={isRecording} />
                </View>

                <Text style={styles.recordStatus}>
                  {isRecording ? "Recording…" : audio ? "Recording ready" : "Tap to record"}
                </Text>
                <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>

                <View style={styles.infoCard}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={Palette.textMuted}
                  />
                  <Text style={styles.infoText}>
                    Please keep the engine running and avoid background noise.
                  </Text>
                </View>

                {isRecording ? (
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={stopRecording}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="stop" size={18} color="#fff" />
                    <Text style={styles.stopText}>Stop recording</Text>
                  </TouchableOpacity>
                ) : audio ? (
                  <View style={styles.audioActions}>
                    <TouchableOpacity
                      style={[styles.submitButton, styles.flexButton]}
                      onPress={handleSubmit}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="sparkles" size={18} color={Palette.onPrimary} />
                          <Text style={styles.submitText}>Run diagnosis</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconGhostButton}
                      onPress={startRecording}
                    >
                      <Ionicons name="refresh" size={20} color={Palette.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.audioIdleActions}>
                    <TouchableOpacity
                      style={styles.recordButton}
                      onPress={startRecording}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="radio-button-on" size={18} color="#fff" />
                      <Text style={styles.stopText}>Start recording</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={pickAudioFile}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="folder-open-outline"
                        size={18}
                        color={Palette.primary}
                      />
                      <Text style={styles.uploadButtonText}>Upload audio file</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* TEXT submit lives under the textarea */}
            {mode === "text" && (
              <TouchableOpacity
                style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color={Palette.onPrimary} />
                    <Text style={styles.submitText}>Run diagnosis</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {loading && (
              <Text style={styles.loadingHint}>
                Analyzing your input — this can take a few seconds.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.bg },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: { gap: Spacing.two },
  title: { color: Palette.textPrimary, fontSize: 26, fontWeight: "bold" },
  subtitle: { color: Palette.textMuted, fontSize: 14, lineHeight: 20 },
  segment: {
    flexDirection: "row",
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 9,
  },
  segmentItemActive: { backgroundColor: Palette.primary },
  segmentLabel: { color: Palette.textMuted, fontSize: 13, fontWeight: "600" },
  segmentLabelActive: { color: Palette.onPrimary },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  textArea: {
    color: Palette.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 150,
  },
  // Viewfinder
  viewfinder: {
    height: 300,
    borderRadius: Radius.lg,
    backgroundColor: "#0c1326",
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  viewfinderInner: { alignItems: "center", gap: Spacing.three, paddingHorizontal: Spacing.four },
  viewfinderText: {
    color: Palette.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  viewfinderImage: { width: "100%", height: "100%" },
  bracket: {
    position: "absolute",
    width: 36,
    height: 36,
    borderColor: Palette.primary,
  },
  bracketTL: { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  bracketTR: { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  bracketBL: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  bracketBR: { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  cameraControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  controlSide: { alignItems: "center", gap: 6, width: 72 },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  controlLabel: { color: Palette.textMuted, fontSize: 12 },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#0c1f3d",
  },
  // Recorder
  recorder: { alignItems: "center", gap: Spacing.three, paddingVertical: Spacing.three },
  micRow: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  waveform: { flexDirection: "row", alignItems: "center", gap: 3, height: 32 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: Palette.primary },
  micCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#101a36",
    borderWidth: 3,
    borderColor: Palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  micCircleActive: { backgroundColor: "#15294f" },
  recordStatus: { color: Palette.textSecondary, fontSize: 15, fontWeight: "600" },
  timer: {
    color: Palette.textPrimary,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    alignSelf: "stretch",
  },
  infoText: { color: Palette.textMuted, fontSize: 13, flex: 1, lineHeight: 18 },
  audioActions: { flexDirection: "row", gap: Spacing.three, alignSelf: "stretch" },
  flexButton: { flex: 1 },
  iconGhostButton: {
    width: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  // Buttons
  submitButton: {
    flexDirection: "row",
    gap: Spacing.two,
    backgroundColor: Palette.primary,
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: Palette.onPrimary, fontSize: 16, fontWeight: "700" },
  audioIdleActions: { alignSelf: "stretch", gap: Spacing.three },
  recordButton: {
    flexDirection: "row",
    gap: Spacing.two,
    backgroundColor: Palette.primary,
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  uploadButton: {
    flexDirection: "row",
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: Palette.primary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  uploadButtonText: { color: Palette.primary, fontSize: 15, fontWeight: "700" },
  stopButton: {
    flexDirection: "row",
    gap: Spacing.two,
    backgroundColor: "#F2711C",
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  stopText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  loadingHint: { color: Palette.textMuted, fontSize: 12, textAlign: "center" },
  resultWrap: { gap: Spacing.four },
  secondaryButton: {
    flexDirection: "row",
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: Palette.primary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: Palette.primary, fontSize: 15, fontWeight: "700" },
});
