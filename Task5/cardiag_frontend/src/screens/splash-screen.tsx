import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Polygon, Text as SvgText } from "react-native-svg";

const SPLASH_DURATION = 3000; // 2 seconds display

// ---------- Keyframes ----------

const carKeyframe = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.85 }, { translateY: 20 }] },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }, { translateY: 0 }],
    easing: Easing.out(Easing.cubic),
  },
});

const logoKeyframe = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 16 }] },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }],
    easing: Easing.out(Easing.quad),
  },
});

const badgeKeyframe = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.2 }] },
  80: { transform: [{ scale: 1.15 }], easing: Easing.out(Easing.back(2)) },
  100: { opacity: 1, transform: [{ scale: 1 }] },
});

const loadingKeyframe = new Keyframe({
  0: { opacity: 0 },
  100: { opacity: 1 },
});

// ---------- Car Illustration ----------

function CarIllustration() {
  return (
    <Image
      source={require("../../assets/images/blue.png")}
      style={styles.carImage}
      resizeMode="contain"
    />
  );
}

// ---------- Warning Badge ----------

function WarningBadge() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28">
      <Polygon
        points="14,2 27,25 1,25"
        fill="#FF9500"
        stroke="#FFB340"
        strokeWidth={1}
      />
      <SvgText
        x={14}
        y={22}
        textAnchor="middle"
        fontSize={14}
        fontWeight="900"
        fill="#1a0800"
      >
        !
      </SvgText>
    </Svg>
  );
}

// ---------- Animated Beam ----------

function HeadlightBeam({ style }: { style?: object }) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.5, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.beam, style, animStyle]} />;
}

// ---------- Circular Loading Indicator ----------

function CircularLoadingIndicator() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withDelay(
      300,
      withRepeat(
        withTiming(360, { duration: 1200, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, []);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.circularLoader, rotationStyle]}>
      <Svg width={48} height={48} viewBox="0 0 48 48">
        <Circle
          cx={24}
          cy={24}
          r={20}
          stroke="rgba(22, 136, 229, 0.2)"
          strokeWidth={2}
          fill="none"
        />
        <Circle
          cx={24}
          cy={24}
          r={20}
          stroke="#1688E5"
          strokeWidth={2}
          fill="none"
          strokeDasharray="31.4 125.6"
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}

// ---------- Dot Pulse ----------

function PulsingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 }),
          withTiming(0, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.Text style={[styles.dot, dotStyle]}>.</Animated.Text>;
}

// ---------- Main Screen ----------

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.();
    }, SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Subtle grid overlay */}
      <View style={styles.gridOverlay} pointerEvents="none" />

      {/* Background glow */}
      <View style={styles.bgGlow} pointerEvents="none" />

      {/* Car + warning badge */}
      <Animated.View
        entering={carKeyframe.duration(900)}
        style={styles.carContainer}
      >
        <HeadlightBeam style={styles.beamLeft} />
        <HeadlightBeam style={styles.beamRight} />
        <CarIllustration />
      </Animated.View>

      {/* Logo */}
      <Animated.View
        entering={logoKeyframe.duration(700).delay(300)}
        style={styles.logoArea}
      >
        <View style={styles.brandRow}>
          <Text style={styles.brandDiag}>CAR</Text>
          <Text style={styles.brandCar}> DIAG</Text>
        </View>
        <Text style={styles.tagline}>Smart Diagnosis. Better Driving.</Text>
      </Animated.View>

      {/* Loading indicator */}
      <Animated.View
        entering={loadingKeyframe.duration(400).delay(1100)}
        style={styles.loadingArea}
      >
        <CircularLoadingIndicator />
        <View style={styles.loadingTextRow}>
          <Text style={styles.loadingText}>Loading</Text>
          <PulsingDot delay={0} />
          <PulsingDot delay={200} />
          <PulsingDot delay={400} />
        </View>
      </Animated.View>
    </View>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 32,
    position: "relative",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    opacity: 0.04,
    // Grid via border trick on each cell isn't feasible in RN;
    // use a very subtle tint instead — a full SVG grid can be added here if desired
    backgroundColor: "transparent",
  },
  bgGlow: {
    position: "absolute",
    width: 320,
    height: 180,
    borderRadius: 160,
    backgroundColor: "transparent",
    top: "35%",
    // A true radial glow needs a library like @shopify/react-native-skia; placeholder:
    borderWidth: 0,
    shadowColor: "#1688E5",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 80,
    shadowOpacity: 0.25,
  },
  carContainer: {
    width: 400,
    height: 300,
    position: "relative",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  carImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    marginBottom: 16,
  },
  beam: {
    position: "absolute",
    bottom: 22,
    width: 80,
    height: 18,
    borderRadius: 40,
    backgroundColor: "#1688E5",
    opacity: 0.5,
  },
  beamLeft: { left: 20 },
  beamRight: { right: 20 },
  warningBadge: {
    position: "absolute",
    top: -6,
    right: 42,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 0,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  brandCar: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 3,
    lineHeight: 46,
    // fontFamily: 'Orbitron-Bold', // Add when font is loaded
  },
  brandDiag: {
    fontSize: 38,
    fontWeight: "900",
    color: "#1688E5",
    letterSpacing: 3,
    lineHeight: 46,
    // fontFamily: 'Orbitron-Bold',
  },
  brandDivider: {
    width: 56,
    height: 2,
    backgroundColor: "#1688E5",
    marginTop: 6,
    borderRadius: 2,
  },
  tagline: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5a6a8a",
    letterSpacing: 1.5,
    marginTop: 8,
    textTransform: "uppercase",
  },
  loadingArea: {
    position: "absolute",
    bottom: 52,
    alignItems: "center",
    gap: 16,
  },
  circularLoader: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 11,
    color: "#3a4a6a",
    letterSpacing: 2,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dot: {
    fontSize: 11,
    color: "#3a4a6a",
    fontWeight: "600",
  },
});
