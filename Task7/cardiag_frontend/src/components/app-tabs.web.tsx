import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import {
  TabList,
  TabListProps,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
  Tabs,
} from "expo-router/ui";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MaxContentWidth, Palette, Spacing } from "@/constants/theme";

const ACTIVE = Palette.primary;
const INACTIVE = "#6a7088";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface TabDef {
  name: string;
  href: Href;
  label: string;
  icon: IconName;
}

// Declared in visual order. "scan" renders as the elevated center FAB.
const TABS: TabDef[] = [
  { name: "home", href: "/", label: "Home", icon: "home" },
  { name: "history", href: "/history", label: "History", icon: "time" },
  { name: "scan", href: "/scan", label: "Scan", icon: "scan" },
  { name: "tutorial", href: "/tutorial", label: "Tutorials", icon: "book" },
  { name: "profile", href: "/people", label: "Profile", icon: "person-circle" },
];

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: "100%" }} />
      <TabList asChild>
        <TabBar>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              {tab.name === "scan" ? (
                <FabButton icon={tab.icon} />
              ) : (
                <TabButton icon={tab.icon}>{tab.label}</TabButton>
              )}
            </TabTrigger>
          ))}
        </TabBar>
      </TabList>
    </Tabs>
  );
}

function TabBar({ children, ...props }: TabListProps) {
  return (
    <View {...props} style={styles.barWrap} pointerEvents="box-none">
      <View style={styles.bar}>{children}</View>
    </View>
  );
}

interface TabButtonProps extends TabTriggerSlotProps {
  icon: IconName;
}

export function TabButton({ children, isFocused, icon, ...props }: TabButtonProps) {
  const color = isFocused ? ACTIVE : INACTIVE;
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.label, { color }]}>{children}</Text>
    </Pressable>
  );
}

export function FabButton({ icon, isFocused: _isFocused, ...props }: TabButtonProps) {
  return (
    <View style={styles.fabSlot}>
      <Pressable
        {...props}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Ionicons name={icon} size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
    paddingBottom: Spacing.three,
    paddingTop: Spacing.two,
  },
  bar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    maxWidth: MaxContentWidth,
    backgroundColor: "#0e1430",
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 22,
    paddingVertical: Spacing.two,
    marginHorizontal: Spacing.three,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: Spacing.one,
  },
  pressed: { opacity: 0.6 },
  label: { fontSize: 11, fontWeight: "600" },
  fabSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Palette.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -34,
    borderWidth: 4,
    borderColor: Palette.bg,
    shadowColor: Palette.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  fabPressed: { opacity: 0.85 },
});
