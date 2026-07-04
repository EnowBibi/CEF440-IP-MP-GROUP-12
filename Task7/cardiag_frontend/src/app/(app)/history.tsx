import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  deleteDiagnosis,
  getDiagnosis,
  getHistory,
} from "@/api/diagnosis";
import { DiagnosisResultView } from "@/components/diagnosis-result";
import { useFeedback } from "@/components/feedback";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api-client";
import { confidenceColor, inputTypeLabel, urgencyColor } from "@/lib/severity";
import type { DiagnosisDetail, DiagnosisHistoryItem } from "@/lib/types";
import { BottomTabInset, Spacing } from "@/constants/theme";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const INPUT_ICON: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  IMAGE: "camera",
  AUDIO: "mic",
  TEXT: "document-text",
};

function HistoryCard({
  item,
  onPress,
}: {
  item: DiagnosisHistoryItem;
  onPress: () => void;
}) {
  const accent = item.recognised ? urgencyColor(item.urgency) : "#8A8F98";
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={[styles.cardIcon, { backgroundColor: `${accent}22` }]}>
        <Ionicons
          name={INPUT_ICON[item.inputType] ?? "document-text"}
          size={20}
          color={accent}
        />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.recognised ? item.faultName : "Unrecognised"}
          </Text>
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.cardMetaRow}>
          <View style={styles.inputChip}>
            <Text style={styles.inputChipText}>
              {inputTypeLabel(item.inputType)}
            </Text>
          </View>
          {item.recognised && !!item.urgency && (
            <Text style={[styles.metaBadge, { color: urgencyColor(item.urgency) }]}>
              {item.urgency}
            </Text>
          )}
          {item.recognised && !!item.confidenceLabel && (
            <Text
              style={[
                styles.metaBadge,
                { color: confidenceColor(item.confidenceLabel) },
              ]}
            >
              {item.confidenceLabel}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#4a5170" />
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const { confirm, toast } = useFeedback();
  const [items, setItems] = useState<DiagnosisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<DiagnosisDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await getHistory(user.id);
      setItems(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load your history.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Refetch every time the tab gains focus so new scans show up.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const d = await getDiagnosis(id);
      setDetail(d);
    } catch (err) {
      toast({
        type: "error",
        message:
          err instanceof ApiError ? err.message : "Could not open this diagnosis.",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = async (id: number) => {
    const ok = await confirm({
      title: "Delete diagnosis",
      message: "Remove this from your history? This can't be undone.",
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;

    setDeleting(true);
    try {
      await deleteDiagnosis(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDetail(null);
      toast({ type: "success", message: "Diagnosis deleted." });
    } catch (err) {
      toast({
        type: "error",
        message: err instanceof ApiError ? err.message : "Could not delete.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const modalOpen = detailLoading || !!detail;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor="#00AAFF"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Your past diagnoses</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#00AAFF" style={{ marginTop: Spacing.six }} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={load}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="time-outline" size={34} color="#00AAFF" />
            </View>
            <Text style={styles.emptyTitle}>No diagnoses yet</Text>
            <Text style={styles.emptyText}>
              Run your first scan from the Diagnose tab.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onPress={() => openDetail(item.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setDetail(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalBar}>
            <Pressable
              onPress={() => setDetail(null)}
              hitSlop={12}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
            {!!detail && (
              <Pressable
                onPress={() => confirmDelete(detail.id)}
                hitSlop={12}
                disabled={deleting}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="trash-outline" size={18} color="#FF4444" />
                <Text style={styles.modalDelete}>
                  {deleting ? "Deleting…" : "Delete"}
                </Text>
              </Pressable>
            )}
          </View>
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            {detailLoading || !detail ? (
              <ActivityIndicator
                color="#00AAFF"
                style={{ marginTop: Spacing.six }}
              />
            ) : (
              <DiagnosisResultView
                data={{
                  recognised: detail.recognised,
                  faultId: detail.faultId,
                  faultName: detail.faultName,
                  category: detail.category,
                  urgency: detail.urgency,
                  description: detail.description,
                  confidenceLabel: detail.confidenceLabel,
                  confidenceScore: detail.confidenceScore,
                  llmReport: detail.llmReport,
                  causes: detail.causes,
                  symptoms: detail.symptoms,
                  repairTips: detail.repairTips,
                  message:
                    detail.imageDescription ??
                    detail.audioTranscription ??
                    detail.userText,
                  inputDescription:
                    detail.imageDescription ??
                    detail.audioTranscription ??
                    detail.userText,
                }}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0e27" },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    flexGrow: 1,
  },
  header: { marginBottom: Spacing.four, gap: Spacing.two },
  title: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  subtitle: { color: "#8A8F98", fontSize: 14 },
  list: { gap: Spacing.three },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    backgroundColor: "#141a36",
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: "#222a4d",
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: Spacing.two },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.two,
  },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "600", flex: 1 },
  cardDate: { color: "#8A8F98", fontSize: 12 },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    flexWrap: "wrap",
  },
  inputChip: {
    backgroundColor: "#1f2547",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  inputChipText: { color: "#aab3d6", fontSize: 11, fontWeight: "600" },
  metaBadge: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.six,
    gap: Spacing.two,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#00AAFF1a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.two,
  },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  emptyText: {
    color: "#8A8F98",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: Spacing.four,
  },
  retryButton: {
    marginTop: Spacing.two,
    borderWidth: 1,
    borderColor: "#00AAFF",
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#00AAFF", fontWeight: "700" },
  modalContainer: { flex: 1, backgroundColor: "#0a0e27" },
  modalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: "#1a2038",
  },
  modalCloseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  modalClose: { color: "#fff", fontSize: 15, fontWeight: "600" },
  modalDelete: { color: "#FF4444", fontSize: 15, fontWeight: "600" },
  modalScroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
});
