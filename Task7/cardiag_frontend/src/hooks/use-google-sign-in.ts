import { useCallback, useState } from "react";

import { useFeedback } from "@/components/feedback";
import { useAuth } from "@/contexts/auth-context";
import { startGoogleSignIn } from "@/lib/oauth";

/**
 * Shared Google OAuth2 handler for the login and register screens.
 * On web the call redirects away; on native it returns tokens which we use to
 * finish the session. Either way the root layout guards handle navigation.
 */
export function useGoogleSignIn() {
  const { signInWithTokens } = useAuth();
  const { toast } = useFeedback();
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      const tokens = await startGoogleSignIn();
      if (tokens) {
        await signInWithTokens(tokens.token, tokens.refreshToken);
      }
    } catch (err) {
      toast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Google sign-in failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [signInWithTokens, toast]);

  return { signIn, loading };
}
