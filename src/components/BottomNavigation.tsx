import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/ui/AppIcon";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";

type NavItem = {
  label: string;
  route: "/" | "/tasks" | "/calendar" | "/settings";
  icon: {
    ios: string;
    android: string;
    web: string;
  };
};

const ITEMS: NavItem[] = [
  { label: "Home", route: "/", icon: { ios: "house", android: "home", web: "home" } },
  { label: "Tasks", route: "/tasks", icon: { ios: "checklist", android: "checklist", web: "checklist" } },
  { label: "Calendar", route: "/calendar", icon: { ios: "calendar", android: "calendar_month", web: "calendar" } },
  { label: "Settings", route: "/settings", icon: { ios: "gearshape", android: "settings", web: "settings" } },
];

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}
    >
      {ITEMS.map((item) => {
        const active =
          item.route === "/"
            ? pathname === "/"
            : pathname.startsWith(item.route);

        return (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <AppIcon
              name={item.icon}
              size={22}
              color={active ? colors.accent : colors.mutedForeground}
            />
            <Text
              style={[
                styles.label,
                { color: active ? colors.accent : colors.mutedForeground },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 68,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingTop: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  label: {
    fontSize: typography.xs,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
});
