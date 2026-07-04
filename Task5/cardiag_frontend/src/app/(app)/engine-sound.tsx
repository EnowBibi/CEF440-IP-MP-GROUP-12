import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BottomTabInset, Spacing } from "@/constants/theme";

// ─── Tokens ───────────────────────────────────────────────
const C = {
  bg: "#000000",
  card: "#0e1420",
  cardBorder: "#1a2236",
  blue: "#1688E5",
  blueBright: "#00cfff",
  blueDim: "rgba(22,136,229,0.15)",
  blueGlow: "rgba(22,136,229,0.35)",
  textPrimary: "#FFFFFF",
  textSub: "#6b7a99",
  textMuted: "#3a4a6a",
  waveform: "#1688E5",
};

// Number of bars each side of the mic
const BAR_COUNT = 7;
const BAR_WIDTH = 4;
const BAR_GAP = 5;
const BAR_MIN_H = 6;
const BAR_MAX_H = 44;

// ─── Single animated bar ─────────────────────────────────
function WaveBar({
  recording,
  delay,
  baseHeight,
}: {
  recording: boolean;
  delay: number;
  baseHeight: number;
}) {
  const anim = useRef(new Animated.Value(baseHeight)).current;
  const loop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (recording) {
      const target = BAR_MIN_H + Math.random() * (BAR_MAX_H - BAR_MIN_H);
      loop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: target,
            duration: 250 + Math.random() * 250,
            delay,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: BAR_MIN_H + Math.random() * 14,
            duration: 250 + Math.random() * 250,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      );
      loop.current.start();
    } else {
      loop.current?.stop();
      Animated.timing(anim, {
        toValue: baseHeight,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    }
    return () => loop.current?.stop();
  }, [recording]);

  return (
    <Animated.View
      style={[
        wb.bar,
        {
          height: anim,
          opacity: recording ? 1 : 0.35,
        },
      ]}
    />
  );
}

const wb = StyleSheet.create({
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
    backgroundColor: C.waveform,
  },
});

// ─── Waveform (one side) ─────────────────────────────────
function WaveGroup({
  recording,
  mirror,
}: {
  recording: boolean;
  mirror?: boolean;
}) {
  // Staggered natural heights for idle state
  const idleHeights = mirror
    ? [10, 20, 30, 36, 28, 18, 8]
    : [8, 18, 28, 36, 30, 20, 10];

  const bars = idleHeights.map((h, i) => (
    <WaveBar key={i} recording={recording} delay={i * 60} baseHeight={h} />
  ));

  return (
    <View style={[wg.row, { flexDirection: mirror ? "row-reverse" : "row" }]}>
      {bars}
    </View>
  );
}

const wg = StyleSheet.create({
  row: { alignItems: "center", gap: BAR_GAP },
});

// ─── Mic button ──────────────────────────────────────────
function MicButton({
  recording,
  onPress,
}: {
  recording: boolean;
  onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const loop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (recording) {
      loop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.18,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.current.start();
    } else {
      loop.current?.stop();
      Animated.timing(pulse, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    return () => loop.current?.stop();
  }, [recording]);

  return (
    <Pressable
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
      onPress={onPress}
    >
      {/* Outer glow ring */}
      <Animated.View
        style={[
          mic.glow,
          { transform: [{ scale: pulse }], opacity: recording ? 1 : 0 },
        ]}
      />
      {/* Mid ring */}
      <View style={mic.mid} />
      {/* Core circle */}
      <View style={mic.core}>
        {/* Mic icon — pure view shapes */}
        <View style={mic.micBody} />
        <View style={mic.micNeck} />
        <View style={mic.micBase} />
        <View style={mic.micStand} />
      </View>
    </Pressable>
  );
}

const MIC_SIZE = 80;

const mic = StyleSheet.create({
  glow: {
    position: "absolute",
    width: MIC_SIZE + 44,
    height: MIC_SIZE + 44,
    borderRadius: (MIC_SIZE + 44) / 2,
    backgroundColor: C.blueGlow,
    top: -(44 / 2),
    left: -(44 / 2),
  },
  mid: {
    position: "absolute",
    width: MIC_SIZE + 24,
    height: MIC_SIZE + 24,
    borderRadius: (MIC_SIZE + 24) / 2,
    backgroundColor: C.blueDim,
    borderWidth: 1,
    borderColor: "rgba(22,136,229,0.3)",
    top: -12,
    left: -12,
  },
  core: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: C.blue,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 0.7,
    elevation: 10,
  },
  // Mic capsule body
  micBody: {
    width: 18,
    height: 26,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    position: "absolute",
    top: 14,
  },
  // Curved neck arch (simulated with border)
  micNeck: {
    position: "absolute",
    top: 34,
    width: 28,
    height: 14,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    borderBottomColor: "transparent",
    borderLeftColor: "#FFFFFF",
    borderRightColor: "#FFFFFF",
    backgroundColor: "transparent",
  },
  micBase: {
    position: "absolute",
    top: 47,
    width: 28,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  micStand: {
    position: "absolute",
    top: 49,
    width: 2.5,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
});

// ─── Timer ────────────────────────────────────────────────
function useTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// ─── Main screen ─────────────────────────────────────────
export default function EngineSoundScreen() {
  const router = useRouter();
  const [rec, setRec] = useState(false);
  const timer = useTimer(rec);

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        {/* ── Header ── */}
        <View style={s.header}>
          <Pressable style={s.iconBtn} onPress={() => router.back()}>
            <ThemedText style={s.headerGlyph}>‹</ThemedText>
          </Pressable>
          <ThemedText style={s.title}>Engine Sound Check</ThemedText>
          <Pressable style={s.iconBtn}>
            <ThemedText style={s.helpGlyph}>?</ThemedText>
          </Pressable>
        </View>

        {/* ── Central recording area ── */}
        <View style={s.center}>
          {/* Waveform + mic row */}
          <View style={s.waveRow}>
            <WaveGroup recording={rec} />
            <View style={s.micWrap}>
              <MicButton recording={rec} onPress={() => setRec((r) => !r)} />
            </View>
            <WaveGroup recording={rec} mirror />
          </View>

          {/* Status + timer */}
          <View style={s.statusArea}>
            <ThemedText style={[s.statusLabel, rec && s.statusActive]}>
              {rec ? "Recording..." : "Tap mic to start"}
            </ThemedText>
            <ThemedText style={[s.timer, rec && s.timerActive]}>
              {timer}
            </ThemedText>
          </View>
        </View>

        {/* ── Tip card ── */}
        <View style={s.tipCard}>
          <ThemedText style={s.tipText}>
            Please keep the engine running{"\n"}and avoid background noise.
          </ThemedText>
        </View>

        {/* ── CTA button ── */}
        <View style={s.btnArea}>
          <Pressable
            style={({ pressed }) => [
              s.btn,
              rec && s.btnStop,
              pressed && { opacity: 0.82 },
            ]}
            onPress={() => setRec((r) => !r)}
          >
            <ThemedText style={s.btnText}>
              {rec ? "Stop Recording" : "Start Recording"}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1, justifyContent: "space-between" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  headerGlyph: {
    fontSize: 24,
    color: C.textPrimary,
    lineHeight: 30,
    marginTop: -2,
  },
  helpGlyph: { fontSize: 15, color: C.textSub, fontWeight: "700" },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: 0.2,
  },

  // Center
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.five ?? 32,
  },
  waveRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  micWrap: {
    width: MIC_SIZE + 44,
    height: MIC_SIZE + 44,
    alignItems: "center",
    justifyContent: "center",
  },

  // Status
  statusArea: { alignItems: "center", gap: 6 },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: C.textSub,
    letterSpacing: 0.3,
  },
  statusActive: { color: C.textPrimary },
  timer: {
    fontSize: 28,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
  timerActive: { color: C.blue },

  // Tip
  tipCard: {
    marginHorizontal: Spacing.four,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  tipText: {
    fontSize: 13,
    color: C.textSub,
    textAlign: "center",
    lineHeight: 20,
  },

  // Button
  btnArea: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset > 0 ? BottomTabInset : Spacing.four,
  },
  btn: {
    backgroundColor: C.blue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    shadowOpacity: 0.5,
    elevation: 8,
  },
  btnStop: { backgroundColor: "#c0392b", shadowColor: "#c0392b" },
  btnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
