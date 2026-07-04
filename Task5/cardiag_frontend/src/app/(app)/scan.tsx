import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useRef, type ComponentProps } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";

const { width: SW, height: SH } = Dimensions.get("window");

// ─── Tokens ───────────────────────────────────────────────
const C = {
  bg: "#000000",
  blue: "#1688E5",
  blueBright: "#00cfff",
  blueDim: "rgba(22,136,229,0.18)",
  orange: "#FF9500",
  orangeDim: "rgba(255,149,0,0.18)",
  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.55)",
  toolbar: "rgba(8,12,24,0.82)",
  cameraBg: "rgba(10,15,28,0.55)",
};

// Frame dimensions
const FRAME_SIZE = SW * 0.72;
const CORNER = 28; // corner bracket arm length
const THICK = 3; // bracket stroke thickness
const ICON_SIZE = 80;

// ─── Scanning pulse animation ─────────────────────────────
function ScanLine() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_SIZE - 4],
  });

  return (
    <Animated.View
      style={[scanLine.line, { transform: [{ translateY }] }]}
      pointerEvents="none"
    />
  );
}

const scanLine = StyleSheet.create({
  line: {
    position: "absolute",
    top: 0,
    left: 4,
    right: 4,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.blueBright,
    opacity: 0.7,
    shadowColor: C.blueBright,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    shadowOpacity: 1,
  },
});

// ─── Icon pulse ───────────────────────────────────────────
function EngineIcon() {
  const glow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.5,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={eng.wrap}>
      {/* outer glow ring */}
      <Animated.View style={[eng.glowRing, { opacity: glow }]} />
      {/* icon background */}
      <View style={eng.circle}>
        <Ionicons
          name="car-sport-outline"
          size={ICON_SIZE * 0.52}
          color={C.orange}
        />
      </View>
    </View>
  );
}

const eng = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    width: ICON_SIZE + 40,
    height: ICON_SIZE + 40,
  },
  glowRing: {
    position: "absolute",
    width: ICON_SIZE + 40,
    height: ICON_SIZE + 40,
    borderRadius: (ICON_SIZE + 40) / 2,
    backgroundColor: C.orangeDim,
  },
  circle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: "rgba(255,149,0,0.14)",
    borderWidth: 2,
    borderColor: "rgba(255,149,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Corner bracket ───────────────────────────────────────
type Corner = "tl" | "tr" | "bl" | "br";

function CornerBracket({ pos }: { pos: Corner }) {
  const isTop = pos === "tl" || pos === "tr";
  const isLeft = pos === "tl" || pos === "bl";

  return (
    <View
      style={[
        bracket.base,
        isTop ? { top: 0 } : { bottom: 0 },
        isLeft ? { left: 0 } : { right: 0 },
      ]}
    >
      {/* horizontal arm */}
      <View
        style={[
          bracket.arm,
          bracket.h,
          isTop ? { top: 0 } : { bottom: 0 },
          isLeft ? { left: 0 } : { right: 0 },
        ]}
      />
      {/* vertical arm */}
      <View
        style={[
          bracket.arm,
          bracket.v,
          isTop ? { top: 0 } : { bottom: 0 },
          isLeft ? { left: 0 } : { right: 0 },
        ]}
      />
    </View>
  );
}

const bracket = StyleSheet.create({
  base: { position: "absolute", width: CORNER, height: CORNER },
  arm: { position: "absolute", backgroundColor: C.blue, borderRadius: 2 },
  h: { height: THICK, width: CORNER },
  v: { width: THICK, height: CORNER },
});

// ─── Camera Viewfinder ────────────────────────────────────
function Viewfinder() {
  return <View style={vf.root} />;
}

const vf = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  bgDark: { ...StyleSheet.absoluteFill, backgroundColor: "#06090f" },
  bgBlueL: {
    position: "absolute",
    top: "15%",
    left: "-10%",
    width: "60%",
    height: "50%",
    borderRadius: 200,
    backgroundColor: C.blue,
    opacity: 0.07,
  },
  bgBlueR: {
    position: "absolute",
    top: "30%",
    right: "-5%",
    width: "50%",
    height: "40%",
    borderRadius: 200,
    backgroundColor: C.blue,
    opacity: 0.05,
  },
  dash: {
    position: "absolute",
    bottom: "18%",
    left: "5%",
    right: "5%",
    height: "30%",
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  gaugeL: {
    flex: 1,
    height: "70%",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(22,136,229,0.25)",
    backgroundColor: "rgba(10,20,40,0.6)",
  },
  gaugeMid: {
    flex: 0.6,
    height: "45%",
    borderRadius: 8,
    backgroundColor: "rgba(22,136,229,0.08)",
    borderWidth: 1,
    borderColor: "rgba(22,136,229,0.15)",
  },
  gaugeR: {
    flex: 1,
    height: "70%",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(22,136,229,0.25)",
    backgroundColor: "rgba(10,20,40,0.6)",
  },
  wheel: {
    position: "absolute",
    bottom: "-8%",
    alignSelf: "center",
    width: "55%",
    height: "25%",
    borderRadius: 200,
    borderWidth: 3,
    borderColor: "rgba(30,46,74,0.7)",
    backgroundColor: "transparent",
  },
});

// ─── Action button ────────────────────────────────────────
function ActionBtn({
  icon,
  label,
  primary = false,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  primary?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [act.wrap, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={[act.circle, primary && act.circleBlue]}>
        <Ionicons
          name={icon}
          size={primary ? 28 : 22}
          color={primary ? C.white : C.muted}
        />
      </View>
      <ThemedText style={act.label}>{label}</ThemedText>
    </Pressable>
  );
}

const act = StyleSheet.create({
  wrap: { alignItems: "center", gap: 6, minWidth: 64 },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleBlue: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.blue,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 0.6,
    elevation: 8,
  },
  label: { fontSize: 11, color: C.muted, fontWeight: "500" },
});

// ─── Main Screen ──────────────────────────────────────────
function ScanScreen() {
  const router = useRouter();

  return (
    <View style={s.root}>
      {/* Full-screen viewfinder background */}
      <Viewfinder />

      {/* Dark vignette overlay */}
      <View style={s.vignette} pointerEvents="none" />

      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        {/* ── Top bar ── */}
        <View style={s.topBar}>
          <Pressable style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={C.white} />
          </Pressable>
          <ThemedText style={s.topTitle}>Scan Warning Lights</ThemedText>
          <Pressable style={s.iconBtn}>
            <Ionicons name="help-circle-outline" size={22} color={C.white} />
          </Pressable>
        </View>

        {/* ── Scanning frame ── */}
        <View style={s.frameArea}>
          <View style={s.frame}>
            {/* Viewfinder inner glow */}
            <View style={s.frameGlow} pointerEvents="none" />

            {/* Corner brackets */}
            <CornerBracket pos="tl" />
            <CornerBracket pos="tr" />
            <CornerBracket pos="bl" />
            <CornerBracket pos="br" />

            {/* Scan line */}
            <ScanLine />

            {/* Engine icon */}
            <EngineIcon />
          </View>

          {/* Hint */}
          <ThemedText style={s.hint}>
            Position the dashboard warning light inside the frame
          </ThemedText>
        </View>

        {/* ── Bottom toolbar ── */}
        <View style={s.toolbar}>
          <ActionBtn icon="flash-outline" label="Flash" />
          <ActionBtn icon="camera" label="Capture" primary />
          <ActionBtn icon="images-outline" label="Gallery" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(6,9,15,0.48)",
  },
  safe: { flex: 1, justifyContent: "space-between" },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.white,
    letterSpacing: 0.2,
  },

  // Frame area
  frameArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: C.blueDim,
    borderWidth: 1,
    borderColor: "rgba(22,136,229,0.2)",
  },
  frameGlow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(22,136,229,0.04)",
  },
  hint: {
    fontSize: 13,
    color: C.muted,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 19,
  },

  // Bottom toolbar
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 20,
    paddingHorizontal: 24,

    marginHorizontal: 0,
  },
});
export default ScanScreen;
