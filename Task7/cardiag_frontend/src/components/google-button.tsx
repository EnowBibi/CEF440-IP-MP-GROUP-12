import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

import { Palette, Radius } from "@/constants/theme";
import { GoogleLogo } from "./google-logo";

/** "Continue with Google" button with the real Google mark. */
export function GoogleButton({
  onPress,
  loading,
  disabled,
}: {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <GoogleLogo size={18} style={styles.logo} />
          <Text style={styles.text}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Palette.inputBorder,
    paddingVertical: 13,
    borderRadius: Radius.md,
    backgroundColor: Palette.surface,
    minHeight: 50,
  },
  logo: {
    marginRight: 10,
  },
  text: {
    color: Palette.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
});
