import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/contexts/auth-context";

/**
 * Landing route for the OAuth2 redirect on web. The backend sends the browser
 * here with `?token=…&refreshToken=…` (or `?error=…`). We persist the tokens
 * and let the root layout guards navigate into the app.
 *
 * On native this screen is generally bypassed (the auth session returns tokens
 * directly to the login screen), but it is kept ungated so the deep link
 * resolves cleanly if it is ever opened.
 */
export default function OAuth2RedirectScreen() {
  const router = useRouter();
  const { signInWithTokens } = useAuth();
  const params = useLocalSearchParams<{
    token?: string;
    refreshToken?: string;
    error?: string;
  }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (params.error) {
        setError(decodeURIComponent(String(params.error)));
        return;
      }
      if (params.token && params.refreshToken) {
        try {
          await signInWithTokens(String(params.token), String(params.refreshToken));
          router.replace("/");
        } catch {
          setError("Could not complete Google sign-in. Please try again.");
        }
      }
    })();
    // Params are stable for the lifetime of this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B35" />
          <Text style={styles.title}>Sign-in failed</Text>
          <Text style={styles.message}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.buttonText}>Back to login</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ActivityIndicator color="#00AAFF" size="large" />
          <Text style={styles.message}>Finishing Google sign-in…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0e27",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  icon: { fontSize: 44 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  message: { color: "#8A8F98", fontSize: 14, textAlign: "center" },
  button: {
    marginTop: 12,
    backgroundColor: "#00AAFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
