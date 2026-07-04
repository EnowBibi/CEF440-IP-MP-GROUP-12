import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";

// ─── Tokens ───────────────────────────────────────────────
const C = {
  bg: "#0a0f1e",
  card: "#111827",
  cardBorder: "#1e2a3a",
  blue: "#1688E5",
  blueActive: "rgba(22,136,229,0.15)",
  amber: "#F59E0B",
  amberDim: "rgba(245,158,11,0.15)",
  red: "#EF4444",
  redDim: "rgba(239,68,68,0.15)",
  green: "#22C55E",
  greenDim: "rgba(34,197,94,0.15)",
  textPrimary: "#FFFFFF",
  textSub: "#6b7a99",
  textMuted: "#3a4a6a",
  divider: "#161e2e",
  tabBg: "#131c2e",
  tabBorder: "#1e2a3a",
};

// ─── Types ────────────────────────────────────────────────
type Severity = "Medium" | "High" | "Normal";
type FilterType = "All" | "Warning Lights" | "Engine Sound";

interface HistoryItem {
  id: string;
  code: string;
  description: string;
  date: string;
  time: string;
  severity: Severity;
  type: "Warning Lights" | "Engine Sound";
}

// ─── Data ─────────────────────────────────────────────────
const HISTORY: HistoryItem[] = [
  {
    id: "1",
    code: "P0301",
    description: "Cylinder 1 Misfire Detected",
    date: "May 20, 2024",
    time: "10:30 AM",
    severity: "Normal",
    type: "Warning Lights",
  },

  {
    id: "3",
    code: "P0171",
    description: "System Too Lean (Bank 1)",
    date: "May 16, 2024",
    time: "09:45 AM",
    severity: "Medium",
    type: "Warning Lights",
  },
  {
    id: "4",
    code: "Engine Sound Check",
    description: "Engine Sound Check",
    date: "May 15, 2024",
    time: "11:20 AM",
    severity: "Normal",
    type: "Engine Sound",
  },
  {
    id: "2",
    code: "P0420",
    description: "Catalyst System Efficiency",
    date: "May 18, 2024",
    time: "03:15 PM",
    severity: "High",
    type: "Warning Lights",
  },
  {
    id: "5",
    code: "P0442",
    description: "Evaporative Emission Leak",
    date: "May 12, 2024",
    time: "04:10 PM",
    severity: "Normal",
    type: "Warning Lights",
  },
];

const FILTERS: FilterType[] = ["All", "Warning Lights", "Engine Sound"];

// ─── Helpers ──────────────────────────────────────────────
function severityColor(s: Severity) {
  return s === "High" ? C.red : s === "Medium" ? C.amber : C.green;
}
function severityDim(s: Severity) {
  return s === "High" ? C.redDim : s === "Medium" ? C.amberDim : C.greenDim;
}

// ─── Severity badge ───────────────────────────────────────
function SeverityBadge({ severity }: { severity: Severity }) {
  const color = severityColor(severity);
  const bg = severityDim(severity);
  return (
    <View style={[bdg.wrap, { backgroundColor: bg, borderColor: color }]}>
      <ThemedText style={[bdg.text, { color }]}>{severity}</ThemedText>
    </View>
  );
}

const bdg = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  text: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
});

// ─── History row ─────────────────────────────────────────
function HistoryRow({ item, last }: { item: HistoryItem; last: boolean }) {
  const accent = severityColor(item.severity);
  const isCode = item.type === "Warning Lights";

  return (
    <Pressable
      style={({ pressed }) => [row.wrap, pressed && { opacity: 0.72 }]}
    >
      {/* Content */}
      <View style={row.body}>
        <ThemedText style={[row.code, isCode && { color: accent }]}>
          {item.code}
        </ThemedText>
        <ThemedText style={row.desc}>{item.description}</ThemedText>
        <ThemedText style={row.meta}>
          {item.date} · {item.time}
        </ThemedText>
      </View>

      {/* Right: badge + chevron */}
      <View style={row.right}>
        <SeverityBadge severity={item.severity} />
        {/* Chevron as text — no icon */}
        <ThemedText style={row.chevron}>›</ThemedText>
      </View>
    </Pressable>
  );
}

const row = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.card,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  bar: {
    width: 3,
    height: "100%",
    borderRadius: 2,
    marginRight: 10,
    alignSelf: "stretch",
  },
  body: { flex: 1, gap: 2 },
  code: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  desc: { fontSize: 12, color: C.textSub },
  meta: { fontSize: 10, color: C.textMuted, marginTop: 1 },
  right: { alignItems: "flex-end", gap: 4, paddingLeft: 8 },
  chevron: { fontSize: 18, color: C.textMuted, lineHeight: 20 },
  divider: { height: 1, backgroundColor: C.divider, marginLeft: 17 },
});

// ─── Filter tabs ──────────────────────────────────────────
function FilterTabs({
  active,
  onChange,
}: {
  active: FilterType;
  onChange: (f: FilterType) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tabs.row}
      style={{ marginBottom: 0 }}
    >
      {FILTERS.map((f) => {
        const isActive = f === active;
        return (
          <Pressable
            key={f}
            style={[tabs.pill, isActive && tabs.pillActive]}
            onPress={() => onChange(f)}
          >
            <ThemedText style={[tabs.label, isActive && tabs.labelActive]}>
              {f}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const tabs = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: Spacing.four,
    paddingVertical: 0,
    maxHeight: 40,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.tabBg,
    borderWidth: 1,
    borderColor: C.tabBorder,
  },
  pillActive: { backgroundColor: C.blue, borderColor: C.blue },
  label: { fontSize: 12, fontWeight: "600", color: C.textSub },
  labelActive: { color: "#FFFFFF" },
});

// ─── Main screen ──────────────────────────────────────────
export default function HistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("All");

  const filtered = HISTORY.filter((h) => filter === "All" || h.type === filter);

  return (
    <ThemedView style={s.root}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        {/* ── Header ── */}
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <ThemedText style={s.backArrow}>‹</ThemedText>
          </Pressable>
          <ThemedText style={s.title}>History</ThemedText>
          {/* Filter funnel — text character, no icon lib */}
          <Pressable style={s.backBtn}>
            <ThemedText style={s.filterGlyph}>⊟</ThemedText>
          </Pressable>
        </View>

        {/* ── Filter tabs ── */}
        <FilterTabs active={filter} onChange={setFilter} />

        {/* ── List ── */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            s.listContent,
            { paddingBottom: BottomTabInset + Spacing.four },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <ThemedText style={s.emptyText}>No records found</ThemedText>
            </View>
          }
          renderItem={({ item, index }) => (
            <HistoryRow item={item} last={index === filtered.length - 1} />
          )}
          ItemSeparatorComponent={() => null}
          style={s.list}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { fontSize: 24, color: "#FFFFFF", lineHeight: 30, marginTop: -2 },
  filterGlyph: { fontSize: 16, color: C.textSub, lineHeight: 20 },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  // List
  list: { flex: 1, marginTop: -500 },
  listContent: { paddingHorizontal: Spacing.four },

  // Card wrapping all rows
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
  },

  // Empty
  empty: { paddingVertical: 48, alignItems: "center" },
  emptyText: { fontSize: 14, color: C.textMuted },
});
