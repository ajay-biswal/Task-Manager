import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeContext";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

export default function Badge({
  label,
  variant = "default",
}: BadgeProps) {
  const { colors } = useTheme();

  const variantStyles = {
    default: {
      backgroundColor: colors.muted,
      color: colors.foreground,
    },
    success: {
      backgroundColor: colors.success,
      color: colors.primaryForeground,
    },
    warning: {
      backgroundColor: colors.medium,
      color: colors.foreground,
    },
    danger: {
      backgroundColor: colors.destructive,
      color: colors.destructiveForeground,
    },
    info: {
      backgroundColor: colors.accent,
      color: colors.primary,
    },
  };

  const current = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: current.backgroundColor }]}>
      <Text style={[styles.label, { color: current.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
