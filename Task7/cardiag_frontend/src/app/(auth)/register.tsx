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

export default function RegisterScreen() {
  const router = useRouter();
  const { toast } = useFeedback();
  const { signUp, clearError, isLoading } = useAuth();
  const { signIn: signInWithGoogle, loading: googleLoading } = useGoogleSignIn();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    clearError();

    if (!fullName.trim()) {
      toast({ type: "error", message: "Please enter your full name" });
      return;
    }

    if (!email.trim()) {
      toast({ type: "error", message: "Please enter your email address" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ type: "error", message: "Please enter a valid email address" });
      return;
    }

    if (!password.trim()) {
      toast({ type: "error", message: "Please enter a password" });
      return;
    }

    if (password.length < 8) {
      toast({
        type: "error",
        message: "Password must be at least 8 characters long",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({ type: "error", message: "Passwords do not match" });
      return;
    }

    if (!agreedToTerms) {
      toast({ type: "error", message: "Please agree to the Terms & Conditions" });
      return;
    }

    try {
      setIsSubmitting(true);
      await signUp(email, password, fullName);
      // Auth state flips to signed-in and the root layout swaps to the app stack.
    } catch (err) {
      toast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "An error occurred during registration",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={isSubmitting}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={18} color={Palette.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.welcomeTitle}>Create account</Text>
          <Text style={styles.welcomeSubtitle}>Join CarDiag today</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Full name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={Palette.placeholder}
                value={fullName}
                onChangeText={setFullName}
                editable={!isSubmitting}
                autoComplete="name"
              />
            </View>
          </View>

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
                autoComplete="new-password"
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
            <Text style={styles.passwordHint}>At least 8 characters</Text>
          </View>

          {/* Confirm password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="••••••••"
                placeholderTextColor={Palette.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!isSubmitting}
                autoComplete="new-password"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
                style={styles.eyeButton}
                hitSlop={8}
                accessibilityLabel={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Palette.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              disabled={isSubmitting}
              style={styles.checkbox}
              hitSlop={8}
            >
              <View
                style={[
                  styles.checkboxInner,
                  agreedToTerms && styles.checkboxInnerChecked,
                ]}
              >
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={14} color={Palette.onPrimary} />
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.termsText}>
              <Text style={styles.termsLabel}>I agree to the </Text>
              <TouchableOpacity
                disabled={isSubmitting}
                hitSlop={8}
                onPress={() =>
                  toast({ type: "info", message: "Terms & Conditions coming soon." })
                }
              >
                <Text style={styles.termsLink}>Terms &amp; Conditions</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.registerButton,
              (isSubmitting || isLoading) && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isSubmitting || isLoading}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Palette.onPrimary} />
            ) : (
              <Text style={styles.registerButtonText}>Create account</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Google Sign Up */}
          <GoogleButton
            onPress={signInWithGoogle}
            loading={googleLoading}
            disabled={isSubmitting || isLoading}
          />

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              disabled={isSubmitting}
              hitSlop={8}
            >
              <Text style={styles.loginLink}>Log in</Text>
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backButtonText: {
    fontSize: 15,
    color: Palette.primary,
    fontWeight: "600",
  },
  header: {
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
  passwordHint: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: Spacing.one,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.four,
    marginTop: Spacing.one,
  },
  checkbox: {
    marginRight: Spacing.three,
  },
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.inputBorder,
    backgroundColor: Palette.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxInnerChecked: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  termsText: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  termsLabel: {
    fontSize: 13,
    color: Palette.textMuted,
  },
  termsLink: {
    fontSize: 13,
    color: Palette.primary,
    fontWeight: "600",
  },
  registerButton: {
    backgroundColor: Palette.primary,
    paddingVertical: 15,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    marginBottom: Spacing.four,
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
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
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.four,
  },
  loginText: {
    color: Palette.textMuted,
    fontSize: 14,
  },
  loginLink: {
    color: Palette.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
