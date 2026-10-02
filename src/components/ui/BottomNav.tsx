import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/ui/AppIcon";
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
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      <View style={styles.navBar}>
        {ITEMS.slice(0, 2).map((item) => renderItem(item))}
        <View style={styles.centerSlot} />
        {ITEMS.slice(2).map((item) => renderItem(item))}

        <Pressable
          onPress={() => router.push("/tasks/form")}
          hitSlop={12}
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Create new task"
        >
          <Text style={styles.fabPlus}>+</Text>
        </Pressable>
      </View>
    </View>
  );

  function renderItem(item: (typeof ITEMS)[number]) {
    const active =
      item.route === "/"
        ? pathname === "/"
        : pathname === item.route || pathname.startsWith(`${item.route}/`);

    return (
      <Pressable
        key={item.route}
        onPress={() => router.navigate(item.route)}
        style={({ pressed }) => [
          styles.item,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.label}`}
      >
        <AppIcon
          name={item.icon}
          size={27}
          color={active ? colors.accent : colors.mutedForeground}
        />
        <Text style={[styles.label, active && styles.activeLabel]}>
          {item.label}
        </Text>
      </Pressable>
    );
  }
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    wrapper: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 0,
      alignItems: "center",
    },

    navBar: {
      width: "100%",
      minHeight: 83,
      paddingHorizontal: 12,
      paddingTop: 10,
      borderRadius: 42,
      borderWidth: 1,
      borderColor: isDark ? "#202936" : colors.border,
      backgroundColor: isDark ? "#10141B" : colors.card,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000000",
      shadowOpacity: 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },

    item: {
      flex: 1,
      height: 66,
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },

    centerSlot: {
      width: 82,
    },

    label: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "600",
      color: colors.mutedForeground,
    },

    activeLabel: {
      color: colors.accent,
      fontWeight: "700",
    },

    fab: {
      position: "absolute",
      left: "50%",
      top: -30,
      marginLeft: -41,
      width: 82,
      height: 82,
      borderRadius: 41,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      borderWidth: 8,
      borderColor: isDark ? "#10141B" : colors.card,
      shadowColor: colors.accent,
      shadowOpacity: 0.28,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 7 },
      elevation: 10,
    },

    fabPlus: {
      width: 40,
      height: 40,
      lineHeight: 40,
      textAlign: "center",
      fontSize: 38,
      fontWeight: "300",
      color: "#FFFFFF",
    },

    pressed: {
      opacity: 0.75,
    },
  });
}