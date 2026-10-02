import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/ui/AppIcon";
import { spacing, typography } from "@/theme";
import type { ThemeColors } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";

const ITEMS = [
  {
    label: "Home",
    route: "/",
    icon: { ios: "house.fill", android: "home", web: "home" },
  },
  {
    label: "Tasks",
    route: "/tasks",
    icon: { ios: "checklist", android: "checklist", web: "checklist" },
  },
  {
    label: "Calendar",
    route: "/calendar",
    icon: { ios: "calendar", android: "calendar_month", web: "calendar_month" },
  },
  {
    label: "Settings",
    route: "/settings",
    icon: { ios: "gearshape.fill", android: "settings", web: "settings" },
  },
] as const;

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
    >
      {ITEMS.map((item) => {
        const active =
          item.route === "/"
            ? pathname === "/"
            : pathname === item.route || pathname.startsWith(`${item.route}/`);

        return (
          <Pressable
            key={item.route}
            onPress={() => router.replace(item.route)}
            style={({ pressed }) => [
              styles.item,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.label}`}
          >
            <AppIcon
              name={item.icon}
              size={21}
              color={active ? colors.accent : colors.mutedForeground}
            />
            <Text style={[styles.label, active && styles.activeLabel]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      flexDirection: "row",
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    item: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
      gap: 3,
    },
    label: {
      fontSize: typography.xs,
      fontWeight: "500",
      color: colors.mutedForeground,
    },
    activeLabel: {
      color: colors.accent,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
