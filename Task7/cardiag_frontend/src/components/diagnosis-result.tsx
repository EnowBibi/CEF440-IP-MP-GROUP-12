import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { getVideosForFault } from "@/api/diagnosis";
import type { VideoResult } from "@/lib/types";
import { confidenceColor, urgencyColor } from "@/lib/severity";

export interface DiagnosisResultData {
  recognised: boolean;
  faultId?: string | null;
  faultName?: string | null;
  category?: string | null;
  urgency?: string | null;
  description?: string | null;
  confidenceLabel?: string | null;
  confidenceScore?: number | null;
  llmReport?: string | null;
  causes?: string[] | null;
  symptoms?: string[] | null;
  repairTips?: string[] | null;
  videos?: VideoResult[] | null;
  message?: string | null;
  inputDescription?: string | null;
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function VideoCard({ video }: { video: VideoResult }) {
  return (
    <TouchableOpacity
      style={styles.videoCard}
      activeOpacity={0.8}
      onPress={() => Linking.openURL(video.videoUrl)}
    >
      {video.thumbnailUrl ? (
        <Image source={{ uri: video.thumbnailUrl }} style={styles.videoThumb} />
      ) : (
        <View style={[styles.videoThumb, styles.videoThumbFallback]}>
          <Ionicons name="play-circle" size={28} color="#00AAFF" />
        </View>
      )}
      <View style={styles.videoMeta}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.videoChannel} numberOfLines={1}>
          {video.channelName}
        </Text>
        {!!video.description && (
          <Text style={styles.videoDescription} numberOfLines={2}>
            {video.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function DiagnosisResultView({ data }: { data: DiagnosisResultData }) {
  const embeddedVideos = data.videos ?? [];
  const [fetchedVideos, setFetchedVideos] = useState<VideoResult[]>([]);

  // Videos aren't stored with a diagnosis, so fetch them by fault id whenever
  // the result doesn't already carry them (e.g. items reopened from history).
  useEffect(() => {
    let active = true;
    if (data.recognised && data.faultId && embeddedVideos.length === 0) {
      getVideosForFault(data.faultId)
        .then((v) => active && setFetchedVideos(v))
        .catch(() => active && setFetchedVideos([]));
    } else {
      setFetchedVideos([]);
    }
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.faultId, data.recognised]);

  if (!data.recognised) {
    return (
      <View style={styles.unrecognisedCard}>
        <Ionicons name="help-circle-outline" size={44} color="#8A8F98" />
        <Text style={styles.unrecognisedTitle}>No match found</Text>
        <Text style={styles.unrecognisedMessage}>
          {data.message ??
            "We couldn't match this to a known fault. Try a clearer photo or more detail."}
        </Text>
        {!!data.inputDescription && (
          <View style={styles.inputEcho}>
            <Text style={styles.inputEchoLabel}>What we understood</Text>
            <Text style={styles.inputEchoText}>{data.inputDescription}</Text>
          </View>
        )}
      </View>
    );
  }

  const causes = data.causes ?? [];
  const symptoms = data.symptoms ?? [];
  const repairTips = data.repairTips ?? [];
  const videos = embeddedVideos.length > 0 ? embeddedVideos : fetchedVideos;

  const lowConfidence =
    data.confidenceLabel?.toUpperCase() === "LOW" || !!data.message;

  return (
    <View style={styles.container}>
      {/* Low-confidence notice — still show the closest fault + tutorials */}
      {lowConfidence && (
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle" size={20} color="#FFA500" />
          <Text style={styles.noticeText}>
            {data.message ??
              "We're not fully confident in this match — it's the closest known fault. Use the guides below as a starting point."}
          </Text>
        </View>
      )}

      {/* Header card */}
      <View style={styles.headerCard}>
        <Text style={styles.faultName}>{data.faultName}</Text>
        {!!data.faultId && <Text style={styles.faultCode}>{data.faultId}</Text>}
        <View style={styles.badgeRow}>
          {!!data.urgency && (
            <Badge label={`${data.urgency} urgency`} color={urgencyColor(data.urgency)} />
          )}
          {!!data.confidenceLabel && (
            <Badge
              label={`${data.confidenceLabel} confidence`}
              color={confidenceColor(data.confidenceLabel)}
            />
          )}
          {!!data.category && (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{data.category}</Text>
            </View>
          )}
        </View>
        {!!data.description && (
          <Text style={styles.description}>{data.description}</Text>
        )}
      </View>

      {!!data.llmReport && (
        <Section title="AI assessment">
          <View style={styles.reportCard}>
            <Text style={styles.reportText}>{data.llmReport}</Text>
          </View>
        </Section>
      )}

      {symptoms.length > 0 && (
        <Section title="Symptoms">
          <BulletList items={symptoms} />
        </Section>
      )}

      {causes.length > 0 && (
        <Section title="Likely causes">
          <BulletList items={causes} />
        </Section>
      )}

      {repairTips.length > 0 && (
        <Section title="Repair tips">
          <BulletList items={repairTips} />
        </Section>
      )}

      {videos.length > 0 && (
        <Section title="Helpful videos">
          <Text style={styles.videoIntro}>
            Top repair walkthroughs for {data.faultName ?? "this fault"}. Tap a
            video to watch on YouTube.
          </Text>
          <View style={styles.videoList}>
            {videos.slice(0, 3).map((v) => (
              <VideoCard key={v.videoId} video={v} />
            ))}
          </View>
        </Section>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    width: "100%",
  },
  noticeCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "#2a220e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#5a4a1e",
    padding: 14,
  },
  noticeText: {
    color: "#e8d9b0",
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  headerCard: {
    backgroundColor: "#141a36",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#222a4d",
    gap: 10,
  },
  faultName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  faultCode: {
    color: "#00AAFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#1f2547",
  },
  categoryChipText: {
    color: "#aab3d6",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  description: {
    color: "#c5cae0",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  reportCard: {
    backgroundColor: "#101633",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#00AAFF",
  },
  reportText: {
    color: "#d7ddf0",
    fontSize: 14,
    lineHeight: 22,
  },
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  bulletDot: {
    color: "#00AAFF",
    fontSize: 16,
    lineHeight: 20,
  },
  bulletText: {
    color: "#c5cae0",
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  videoList: {
    gap: 12,
  },
  videoCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#141a36",
    borderRadius: 12,
    padding: 10,
    alignItems: "flex-start",
  },
  videoThumb: {
    width: 120,
    height: 68,
    borderRadius: 8,
    backgroundColor: "#0a0e27",
  },
  videoThumbFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    color: "#00AAFF",
    fontSize: 22,
  },
  videoMeta: {
    flex: 1,
    gap: 4,
  },
  videoTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  videoChannel: {
    color: "#8A8F98",
    fontSize: 12,
  },
  videoDescription: {
    color: "#9aa1bd",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  videoIntro: {
    color: "#8A8F98",
    fontSize: 12,
    lineHeight: 17,
    marginTop: -2,
  },
  unrecognisedCard: {
    backgroundColor: "#141a36",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#222a4d",
  },
  unrecognisedIcon: {
    fontSize: 40,
  },
  unrecognisedTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  unrecognisedMessage: {
    color: "#aab3d6",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  inputEcho: {
    marginTop: 8,
    backgroundColor: "#101633",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    gap: 4,
  },
  inputEchoLabel: {
    color: "#8A8F98",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputEchoText: {
    color: "#c5cae0",
    fontSize: 14,
    lineHeight: 20,
  },
});
