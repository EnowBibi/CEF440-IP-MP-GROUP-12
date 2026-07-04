import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

const SELECTED_COLOR = "#00AAFF";
const UNSELECTED_COLOR = "#666";

interface TabConfig {
  name: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconFocused: React.ComponentProps<typeof Ionicons>["name"];
}

const tabs: TabConfig[] = [
  { name: "index", label: "Home", icon: "home-outline", iconFocused: "home" },
  {
    name: "scan",
    label: "Scan",
    icon: "scan-circle-outline",
    iconFocused: "scan-circle",
  },
  {
    name: "history",
    label: "History",
    icon: "time-outline",
    iconFocused: "time",
  },
  {
    name: "tutorial",
    label: "Tutorial",
    icon: "book-outline",
    iconFocused: "book",
  },
  {
    name: "people",
    label: "Profile",
    icon: "person-circle-outline",
    iconFocused: "person-circle",
  },
];
// Routes that exist but should NOT appear in the tab bar
const hiddenRoutes = ["engine-sound"];

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors =
    Colors[scheme === "unspecified" ? "light" : (scheme ?? "light")];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: SELECTED_COLOR,
        tabBarInactiveTintColor: UNSELECTED_COLOR,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.backgroundElement,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      {hiddenRoutes.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}

      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
