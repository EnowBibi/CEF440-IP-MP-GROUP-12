import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFeedback } from "@/components/feedback";
import { GoogleButton } from "@/components/google-button";
import { Palette, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useGoogleSignIn } from "@/hooks/use-google-sign-in";

export default function LoginScreen() {
  const router = useRouter();
  const { toast } = useFeedback();
  const { signIn, clearError, isLoading } = useAuth();
  const { signIn: signInWithGoogle, loading: googleLoading } = useGoogleSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    clearError();

    if (!email.trim()) {
      toast({ type: "error", message: "Please enter your email address" });
      return;
    }

    if (!password.trim()) {
      toast({ type: "error", message: "Please enter your password" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ type: "error", message: "Please enter a valid email address" });
      return;
    }

    try {
      setIsSubmitting(true);
      await signIn(email, password);
      // Navigation is automatic: the root layout guards swap to the app stack
      // as soon as the auth state flips to signed-in.
    } catch (err) {
      toast({
        type: "error",
        message:
          err instanceof Error ? err.message : "An error occurred during login",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    toast({ type: "info", message: "Password reset is coming soon." });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeSubtitle}>Log in to continue</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Palette.placeholder}
                value={email}
                onChangeText={setEmail}
                editable={!isSubmitting}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="••••••••"
                placeholderTextColor={Palette.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isSubmitting}
                autoComplete="current-password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                style={styles.eyeButton}
                hitSlop={8}
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Palette.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleForgotPassword}
            disabled={isSubmitting}
            style={styles.forgotPasswordButton}
            hitSlop={8}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.loginButton,
              (isSubmitting || isLoading) && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isSubmitting || isLoading}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Palette.onPrimary} />
            ) : (
              <Text style={styles.loginButtonText}>Log in</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Google Sign In */}
          <GoogleButton
            onPress={signInWithGoogle}
            loading={googleLoading}
            disabled={isSubmitting || isLoading}
          />

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don&apos;t have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              disabled={isSubmitting}
              hitSlop={8}
            >
              <Text style={styles.signupLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  header: {
    marginTop: Spacing.five,
    marginBottom: Spacing.five,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: Palette.textPrimary,
    marginBottom: Spacing.one,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: Palette.textMuted,
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Palette.textSecondary,
    marginBottom: Spacing.two,
  },
  inputWrapper: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.inputBorder,
    backgroundColor: Palette.surface,
    overflow: "hidden",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.inputBorder,
    backgroundColor: Palette.surface,
    paddingRight: Spacing.two,
  },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    color: Palette.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  inputFlex: {
    flex: 1,
  },
  eyeButton: {
    padding: Spacing.two,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: Spacing.four,
  },
  forgotPasswordText: {
    color: Palette.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: Palette.primary,
    paddingVertical: 15,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    marginBottom: Spacing.four,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: Palette.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.four,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.border,
  },
  dividerText: {
    color: Palette.textMuted,
    fontSize: 12,
    marginHorizontal: Spacing.three,
    fontWeight: "500",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.four,
  },
  signupText: {
    color: Palette.textMuted,
    fontSize: 14,
  },
  signupLink: {
    color: Palette.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
