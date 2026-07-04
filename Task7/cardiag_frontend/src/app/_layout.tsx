import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { FeedbackProvider } from "@/components/feedback";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import SplashScreen from "@/screens/splash-screen";

function RootLayoutNav() {
  const { isSignedIn, isLoading } = useAuth();

  // Hold the splash until we know whether a stored session exists.
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0a0e27" },
      }}
    >
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      {/* Ungated: the OAuth2 redirect must resolve regardless of auth state. */}
      <Stack.Screen name="oauth2/redirect" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <FeedbackProvider>
        <StatusBar style="light" />
        <RootLayoutNav />
      </FeedbackProvider>
    </AuthProvider>
  );
}
