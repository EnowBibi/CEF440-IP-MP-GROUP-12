import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getHistory } from "@/api/diagnosis";
import { useFeedback } from "@/components/feedback";
import { useAuth } from "@/contexts/auth-context";
import { BottomTabInset, Palette, Radius, Spacing } from "@/constants/theme";
import { urgencyColor } from "@/lib/severity";
import type { DiagnosisHistoryItem } from "@/lib/types";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function firstName(full?: string): string {
  return full?.trim().split(/\s+/)[0] ?? "there";
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

const INPUT_ICON: Record<string, IconName> = {
  IMAGE: "camera",
  AUDIO: "mic",
  TEXT: "document-text",
};

interface QuickAction {
  icon: IconName;
  title: string;
  subtitle: string;
  tint: string;
  onPress: () => void;
}

function QuickActionTile({ action }: { action: QuickAction }) {
  return (
    <TouchableOpacity
      style={styles.quickTile}
      activeOpacity={0.85}
      onPress={action.onPress}
    >
      <View style={[styles.quickIcon, { backgroundColor: `${action.tint}22` }]}>
        <Ionicons name={action.icon} size={22} color={action.tint} />
      </View>
      <Text style={styles.quickTitle}>{action.title}</Text>
      <Text style={styles.quickSubtitle} numberOfLines={1}>
        {action.subtitle}
      </Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useFeedback();
  const [history, setHistory] = useState<DiagnosisHistoryItem[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setHistory(await getHistory(user.id));
    } catch {
      /* Dashboard stays usable if recent activity can't load. */
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const urgentCount = useMemo(
    () =>
      history.filter(
        (h) =>
          h.recognised &&
          (h.urgency?.toUpperCase() === "HIGH" ||
            h.urgency?.toUpperCase() === "CRITICAL"),
      ).length,
    [history],
  );

  const recent = history.slice(0, 3);
  const healthy = urgentCount === 0;

  const quickActions: QuickAction[] = [
    {
      icon: "scan",
      title: "Scan",
      subtitle: "Warning lights",
      tint: Palette.primary,
      onPress: () => router.push({ pathname: "/scan", params: { mode: "photo" } }),
    },
    {
      icon: "mic",
      title: "Record",
      subtitle: "Engine sound",
      tint: "#9b6dff",
      onPress: () => router.push({ pathname: "/scan", params: { mode: "audio" } }),
    },
    {
      icon: "book",
      title: "Tutorials",
      subtitle: "Repair guides",
      tint: Palette.success,
      onPress: () => router.push("/tutorial"),
    },
    {
      icon: "time",
      title: "History",
      subtitle: "View records",
      tint: "#FF8A3D",
      onPress: () => router.push("/history"),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.topRow}>
          <View style={styles.greetingWrap}>
            <Text style={styles.greeting}>
              Hello, <Text style={styles.greetingName}>{firstName(user?.fullName)}!</Text>
            </Text>
            <Text style={styles.subtitle}>Welcome back to CarDiag</Text>
          </View>
          <TouchableOpacity
            style={styles.bell}
            onPress={() =>
              toast({ type: "info", message: "You're all caught up — no new alerts." })
            }
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            {urgentCount > 0 && <View style={styles.bellDot} />}
          </TouchableOpacity>
        </View>

        {/* Vehicle Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <Text style={styles.statusLabel}>Vehicle Status</Text>
            <Text
              style={[
                styles.statusValue,
                { color: healthy ? Palette.success : "#FF8A3D" },
              ]}
            >
              {healthy ? "Good" : "Attention"}
            </Text>
            <Text style={styles.statusSub}>
              {healthy
                ? "No active faults detected"
                : `${urgentCount} issue${urgentCount > 1 ? "s" : ""} need attention`}
            </Text>
          </View>
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: healthy ? "#44D17A1f" : "#FF8A3D1f" },
            ]}
          >
            <Ionicons
              name="car-sport"
              size={40}
              color={healthy ? Palette.success : "#FF8A3D"}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          {quickActions.map((a) => (
            <QuickActionTile key={a.title} action={a} />
          ))}
        </View>

        {/* Recent Diagnoses */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Diagnoses</Text>
          {recent.length > 0 && (
            <TouchableOpacity onPress={() => router.push("/history")} hitSlop={8}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recent.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="sparkles-outline" size={26} color={Palette.textMuted} />
            <Text style={styles.emptyText}>
              No diagnoses yet. Run your first scan to see results here.
            </Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recent.map((item) => {
              const accent = item.recognised ? urgencyColor(item.urgency) : "#8A8F98";
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recentCard}
                  activeOpacity={0.85}
                  onPress={() => router.push("/history")}
                >
                  <View style={[styles.recentStripe, { backgroundColor: accent }]} />
                  <View style={[styles.recentIcon, { backgroundColor: `${accent}22` }]}>
                    <Ionicons
                      name={INPUT_ICON[item.inputType] ?? "document-text"}
                      size={20}
                      color={accent}
                    />
                  </View>
                  <View style={styles.recentBody}>
                    <Text style={styles.recentCode}>
                      {item.recognised ? item.faultId ?? item.faultName : "Unrecognised"}
                    </Text>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {item.recognised ? item.faultName : "No fault matched"}
                    </Text>
                    <Text style={styles.recentDate}>{formatDateTime(item.createdAt)}</Text>
                  </View>
                  {item.recognised && !!item.urgency && (
                    <View
                      style={[styles.severityBadge, { backgroundColor: `${accent}22` }]}
                    >
                      <Text style={[styles.severityText, { color: accent }]}>
                        {item.urgency}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Vehicle Information */}
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        <TouchableOpacity
          style={styles.vehicleCard}
          activeOpacity={0.85}
          onPress={() =>
            toast({ type: "info", message: "Vehicle management is coming soon." })
          }
        >
          <View style={styles.vehicleIcon}>
            <Ionicons name="car-outline" size={24} color={Palette.primary} />
          </View>
          <View style={styles.vehicleBody}>
            <Text style={styles.vehicleName}>Add your vehicle</Text>
            <Text style={styles.vehicleSub}>
              Save your make, model and VIN for tailored diagnoses
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#4a5170" />
        </TouchableOpacity>
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
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingWrap: { flex: 1 },
  greeting: { color: Palette.textPrimary, fontSize: 24, fontWeight: "bold" },
  greetingName: { color: Palette.primary },
  subtitle: { color: Palette.textMuted, fontSize: 14, marginTop: 2 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Palette.danger,
    borderWidth: 1.5,
    borderColor: Palette.surface,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.four,
  },
  statusLeft: { flex: 1, gap: 4 },
  statusLabel: { color: Palette.textMuted, fontSize: 13, fontWeight: "600" },
  statusValue: { fontSize: 28, fontWeight: "800" },
  statusSub: { color: Palette.textSecondary, fontSize: 13 },
  statusIcon: {
    width: 76,
    height: 76,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { color: Palette.textPrimary, fontSize: 16, fontWeight: "700" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAll: { color: Palette.primary, fontSize: 13, fontWeight: "600" },
  quickRow: { flexDirection: "row", gap: Spacing.two },
  quickTile: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.three,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 6,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickTitle: { color: Palette.textPrimary, fontSize: 12.5, fontWeight: "700" },
  quickSubtitle: { color: Palette.textMuted, fontSize: 10, textAlign: "center" },
  recentList: { gap: Spacing.three },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingLeft: Spacing.three + 6,
    overflow: "hidden",
  },
  recentStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  recentIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  recentBody: { flex: 1, gap: 2 },
  recentCode: { color: Palette.textPrimary, fontSize: 14, fontWeight: "700" },
  recentName: { color: Palette.textSecondary, fontSize: 12.5 },
  recentDate: { color: Palette.textMuted, fontSize: 11, marginTop: 1 },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  severityText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  emptyCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: "center",
    gap: Spacing.two,
  },
  emptyText: { color: Palette.textMuted, fontSize: 14, textAlign: "center" },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.three,
  },
  vehicleIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#00AAFF1f",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleBody: { flex: 1, gap: 2 },
  vehicleName: { color: Palette.textPrimary, fontSize: 14, fontWeight: "600" },
  vehicleSub: { color: Palette.textMuted, fontSize: 12, lineHeight: 16 },
});
