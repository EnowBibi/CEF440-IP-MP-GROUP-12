import { Ionicons } from "@expo/vector-icons";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Palette, Radius, Spacing } from "@/constants/theme";

/**
 * Cross-platform feedback: themed confirm/alert dialogs and toasts.
 *
 * `react-native-web`'s `Alert.alert` is a no-op (its button callbacks never
 * fire), which silently broke logout, delete, and every error message on web.
 * This provider replaces it with real, on-brand UI that works everywhere.
 */

type ToastType = "success" | "error" | "info";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface AlertOptions {
  title: string;
  message?: string;
  buttonText?: string;
}

interface ToastOptions {
  message: string;
  type?: ToastType;
}

interface FeedbackApi {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
  toast: (options: ToastOptions) => void;
}

const FeedbackContext = createContext<FeedbackApi | undefined>(undefined);

interface DialogState {
  kind: "confirm" | "alert";
  options: ConfirmOptions & AlertOptions;
  resolve: (value: boolean) => void;
}

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

const TOAST_ICON: Record<ToastType, React.ComponentProps<typeof Ionicons>["name"]> = {
  success: "checkmark-circle",
  error: "alert-circle",
  info: "information-circle",
};

const TOAST_COLOR: Record<ToastType, string> = {
  success: Palette.success,
  error: Palette.danger,
  info: Palette.primary,
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeDialog = useCallback(
    (value: boolean) => {
      dialog?.resolve(value);
      setDialog(null);
    },
    [dialog],
  );

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setDialog({ kind: "confirm", options, resolve });
      }),
    [],
  );

  const alert = useCallback(
    (options: AlertOptions) =>
      new Promise<void>((resolve) => {
        setDialog({ kind: "alert", options, resolve: () => resolve() });
      }),
    [],
  );

  const toast = useCallback((options: ToastOptions) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastState({
      id: Date.now(),
      message: options.message,
      type: options.type ?? "info",
    });
    toastTimer.current = setTimeout(() => setToastState(null), 3200);
  }, []);

  const api = useMemo<FeedbackApi>(
    () => ({ confirm, alert, toast }),
    [confirm, alert, toast],
  );

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      {/* Dialog */}
      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={() => closeDialog(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => closeDialog(false)}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>{dialog?.options.title}</Text>
            {!!dialog?.options.message && (
              <Text style={styles.message}>{dialog.options.message}</Text>
            )}

            {dialog?.kind === "confirm" ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => closeDialog(false)}
                >
                  <Text style={styles.cancelText}>
                    {dialog.options.cancelText ?? "Cancel"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    dialog.options.destructive
                      ? styles.destructiveButton
                      : styles.confirmButton,
                  ]}
                  onPress={() => closeDialog(true)}
                >
                  <Text style={styles.confirmText}>
                    {dialog.options.confirmText ?? "Confirm"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, styles.fullButton]}
                onPress={() => closeDialog(true)}
              >
                <Text style={styles.confirmText}>
                  {dialog?.options.buttonText ?? "OK"}
                </Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Toast */}
      {toastState && (
        <View
          style={[styles.toastWrap, { top: insets.top + Spacing.two }]}
          pointerEvents="box-none"
        >
          <Animated.View
            key={toastState.id}
            entering={FadeInUp.duration(220)}
            exiting={FadeOutUp.duration(180)}
            style={styles.toast}
          >
            <Ionicons
              name={TOAST_ICON[toastState.type]}
              size={20}
              color={TOAST_COLOR[toastState.type]}
            />
            <Text style={styles.toastText}>{toastState.message}</Text>
          </Animated.View>
        </View>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(3,6,18,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    color: Palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  message: {
    color: Palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  fullButton: {
    marginTop: Spacing.three,
  },
  cancelButton: {
    backgroundColor: Palette.surfaceAlt,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  confirmButton: {
    backgroundColor: Palette.primary,
  },
  destructiveButton: {
    backgroundColor: Palette.danger,
  },
  cancelText: {
    color: Palette.textSecondary,
    fontWeight: "600",
    fontSize: 15,
  },
  confirmText: {
    color: Palette.onPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    zIndex: 1000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    maxWidth: 480,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  toastText: {
    color: Palette.textPrimary,
    fontSize: 14,
    fontWeight: "500",
    flexShrink: 1,
  },
});
