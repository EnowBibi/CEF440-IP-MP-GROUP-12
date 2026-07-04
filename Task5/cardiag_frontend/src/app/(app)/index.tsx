import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useRouter } from "expo-router";

// ─── Tokens ───────────────────────────────────────────────
const C = {
  blue: "#1688E5",
  blueDim: "rgba(22,136,229,0.12)",
  blueGlow: "rgba(22,136,229,0.25)",
  accent: "#00cfff",
  good: "#22C55E",
  medium: "#F59E0B",
  high: "#EF4444",
  surface: "#000000",
  card: "#16191c",
  cardBorder: "rgba(255,255,255,0.08)",
  textPrimary: "#FFFFFF",
  textSecondary: "#7a8aaa",
  textMuted: "#3a4a6a",
};

// ─── Types ────────────────────────────────────────────────
type Severity = "Good" | "Medium" | "High" | "Normal";

interface QuickAction {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  sublabel: string;
  onPress?: () => void;
}

interface Diagnosis {
  code: string;
  description: string;
  date: string;
  severity: Severity;
}

// ─── Data ─────────────────────────────────────────────────
const QUICK_ACTIONS: QuickAction[] = [
  { icon: "warning-outline", label: "Scan", sublabel: "Warning Lights" },
  { icon: "volume-medium-outline", label: "Engine", sublabel: "Sound Check" },
  { icon: "time-outline", label: "History", sublabel: "Records" },
  { icon: "book-outline", label: "Tutorials", sublabel: "Repair Guides" },
];

const RECENT_DIAGNOSES: Diagnosis[] = [
  {
    code: "P0301",
    description: "Cylinder 1 Misfire Detected",
    date: "May 20, 2024",
    severity: "Medium",
  },

  {
    code: "P0128",
    description: "Engine Coolant Thermostat Malfunction",
    date: "May 16, 2024",
    severity: "Good",
  },
  {
    code: "P0101",
    description: "Mass Airflow Sensor Range/Performance",
    date: "May 14, 2024",
    severity: "Good",
  },
  {
    code: "P0171",
    description: "System Too Lean (Bank 1)",
    date: "May 12, 2024",
    severity: "Good",
  },
  {
    code: "P0420",
    description: "Catalyst System Efficiency",
    date: "May 18, 2024",
    severity: "High",
  },
  {
    code: "P0442",
    description: "Evaporative Emission System Leak Detected",
    date: "May 10, 2024",
    severity: "Good",
  },
];

// ─── Severity helpers ─────────────────────────────────────
function severityColor(s: Severity) {
  return s === "Good"
    ? C.good
    : s === "High"
      ? C.high
      : s === "Medium"
        ? C.medium
        : C.good;
}

// ─── Sub-components ───────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const color = severityColor(severity);
  return (
    <View
      style={[
        badge.wrap,
        { borderColor: color, backgroundColor: color + "22" },
      ]}
    >
      <ThemedText style={[badge.text, { color }]}>{severity}</ThemedText>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  text: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
});

function VehicleStatusCard() {
  return (
    <View style={card.wrap}>
      {/* left column */}
      <View style={card.left}>
        <ThemedText style={card.sectionLabel}>Vehicle Status</ThemedText>
        <View style={card.statusRow}>
          <ThemedText style={[card.statusText, { color: C.good }]}>
            Good
          </ThemedText>
        </View>
        <ThemedText style={card.statusSub}>
          No critical faults detected
        </ThemedText>
      </View>

      {/* right — simple car silhouette via nested views */}
      <View style={card.carWrap}>
        <View style={card.carGlow} />
        {/* cabin */}
        <View style={card.cabin} />
        {/* body */}
        <View style={card.body} />
        {/* headlight */}
        <View style={[card.light, card.lightL]} />
        <View style={[card.light, card.lightR]} />
        {/* wheels */}
        <View style={[card.wheel, card.wheelL]} />
        <View style={[card.wheel, card.wheelR]} />
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    backgroundColor: "#171616",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    opacity: 0.75,
  },
  left: { flex: 1, gap: 4 },
  sectionLabel: {
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 22, fontWeight: "800" },
  statusSub: { fontSize: 11, color: C.textSecondary },
  carWrap: {
    width: 110,
    height: 62,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  carGlow: {
    position: "absolute",
    width: 90,
    height: 30,
    borderRadius: 45,
    backgroundColor: C.blue,
    opacity: 0.12,
  },
  cabin: {
    position: "absolute",
    top: 4,
    left: 22,
    right: 22,
    height: 22,
    backgroundColor: "#1e2e4a",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  body: {
    position: "absolute",
    top: 22,
    left: 4,
    right: 4,
    height: 20,
    backgroundColor: "#1a2840",
    borderRadius: 5,
  },
  light: {
    position: "absolute",
    top: 28,
    width: 10,
    height: 7,
    borderRadius: 3,
    backgroundColor: C.blue,
    opacity: 0.9,
  },
  lightL: { left: 4 },
  lightR: { right: 4 },
  wheel: {
    position: "absolute",
    bottom: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#0d1525",
    borderWidth: 2,
    borderColor: C.blue,
  },
  wheelL: { left: 14 },
  wheelR: { right: 14 },
});

function QuickActionButton({
  item,
  router,
}: {
  item: QuickAction;
  router: ReturnType<typeof useRouter>;
}) {
  function handlePress() {
    if (item.label === "Engine") {
      router.push("/engine-sound");
      return;
    }
    if (item.label === "History") {
      router.push("/history");
      return;
    }
    if (item.label === "Scan") {
      router.push("/scan");
      return;
    }
    if (item.label === "Tutorials") {
      router.push("/tutorial");
      return;
    }

    item.onPress?.();
  }

  return (
    <Pressable
      style={({ pressed }) => [qa.wrap, pressed && { opacity: 0.75 }]}
      onPress={handlePress}
    >
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={qa.iconWrap}>
          <Ionicons name={item.icon} size={22} color={C.blue} />
        </View>
        <View
          style={{ justifyContent: "flex-start", alignItems: "flex-start" }}
        >
          <ThemedText style={qa.label}>{item.label}</ThemedText>
          <ThemedText style={qa.sub}>{item.sublabel}</ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const qa = StyleSheet.create({
  wrap: {
    width: "48%",
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 6,
    marginBottom: Spacing.two,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.blueDim,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textPrimary,
    textAlign: "center",
  },
  sub: { fontSize: 10, color: C.textSecondary, textAlign: "center" },
});

function DiagnosisRow({ item }: { item: Diagnosis }) {
  return (
    <Pressable style={({ pressed }) => [diag.row, pressed && { opacity: 0.7 }]}>
      <View style={diag.info}>
        <ThemedText style={diag.code}>{item.code}</ThemedText>
        <ThemedText style={diag.desc}>{item.description}</ThemedText>
        <ThemedText style={diag.date}>{item.date}</ThemedText>
      </View>
      <View style={diag.right}>
        <SeverityBadge severity={item.severity} />
      </View>
    </Pressable>
  );
}

const diag = StyleSheet.create({
  row: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 2 },
  code: { fontSize: 14, fontWeight: "800", color: C.textPrimary },
  desc: { fontSize: 12, color: C.textSecondary },
  date: { fontSize: 10, color: C.textMuted },
  right: { alignItems: "flex-end", gap: 2 },
});

// ─── Main screen ──────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  return (
    <ThemedView style={s.root}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.content,
            { paddingBottom: BottomTabInset + Spacing.four },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={s.header}>
            <View>
              <ThemedText style={s.greeting}>Good Morning!</ThemedText>
              <ThemedText style={s.userName}>John Doe</ThemedText>
            </View>
            <Pressable style={s.bellWrap}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={C.textSecondary}
              />
              {/* unread dot */}
              <View style={s.bellDot} />
            </Pressable>
          </View>

          {/* ── Vehicle Status ── */}
          <VehicleStatusCard />

          {/* ── Quick Actions ── */}
          <View style={s.section}>
            <ThemedText style={s.sectionTitle}>Quick Actions</ThemedText>
            <View style={s.qaGrid}>
              {QUICK_ACTIONS.map((item) => (
                <QuickActionButton
                  key={item.label}
                  item={item}
                  router={router}
                />
              ))}
            </View>
          </View>

          {/* ── Recent Diagnoses ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <ThemedText style={s.sectionTitle}>Recent Diagnoses</ThemedText>
              <Pressable>
                <ThemedText style={s.viewAll}>View All</ThemedText>
              </Pressable>
            </View>

            <View style={s.diagCard}>
              {RECENT_DIAGNOSES.map((item, i) => (
                <View key={item.code}>
                  <DiagnosisRow item={item} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.four,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userName: { fontSize: 13, color: C.textSecondary, fontWeight: "500" },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: C.textPrimary,
    marginTop: 1,
  },
  bellWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.blue,
    borderWidth: 1.5,
    borderColor: C.surface,
  },

  // Section
  section: { gap: Spacing.two },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: 0.2,
  },
  viewAll: { fontSize: 12, color: C.blue, fontWeight: "600" },

  // Quick actions
  qaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // Diagnoses card
  diagCard: {
    paddingVertical: Spacing.two,
  },
  divider: {
    height: 1,
    backgroundColor: C.cardBorder,
    marginVertical: Spacing.two,
  },
});
