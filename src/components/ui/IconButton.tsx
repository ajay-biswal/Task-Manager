import { Pressable, StyleSheet } from "react-native";
import type { ReactNode } from "react";

import { useTheme } from "@/theme/ThemeContext";

type IconButtonProps = {
  icon: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: "default" | "ghost" | "danger";
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
};

export default function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = "default",
  disabled = false,
  size = "md",
}: IconButtonProps) {
  const { colors } = useTheme();

  const sizeStyle = styles[size];

  const backgroundColor =
    variant === "default"
      ? colors.muted
      : variant === "danger"
        ? colors.destructive
        : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        sizeStyle,
        {
          backgroundColor,
          borderColor: colors.border,
        },
        variant === "default" && styles.bordered,
        variant === "danger" && styles.bordered,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  sm: {
    width: 36,
    height: 36,
  },
  md: {
    width: 44,
    height: 44,
  },
  lg: {
    width: 52,
    height: 52,
  },
  bordered: {
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
