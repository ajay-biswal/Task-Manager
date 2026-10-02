import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, spacing, typography } from "@/theme";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "destructive";
}

export function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,

        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "destructive" && styles.destructive,

        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary"
              ? colors.light.primaryForeground
              : colors.light.foreground
          }
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === "primary" && styles.primaryText,
            variant === "secondary" && styles.secondaryText,
            variant === "destructive" && styles.primaryText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },

  primary: {
    backgroundColor: colors.light.primary,
  },

  secondary: {
    backgroundColor: colors.light.background,
    borderWidth: 1,
    borderColor: colors.light.border,
  },

  destructive: {
    backgroundColor: colors.light.destructive,
  },

  text: {
    fontSize: typography.md,
    fontWeight: "600",
  },

  primaryText: {
    color: colors.light.primaryForeground,
  },

  secondaryText: {
    color: colors.light.foreground,
  },

  pressed: {
    opacity: 0.8,
  },

  disabled: {
    opacity: 0.5,
  },
});
