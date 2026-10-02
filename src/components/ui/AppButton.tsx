import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";

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
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,

        variant === "primary" && { backgroundColor: colors.primary },
        variant === "secondary" && { backgroundColor: colors.background, borderColor: colors.border },
        variant === "destructive" && { backgroundColor: colors.destructive },

        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary"
              ? colors.primaryForeground
              : colors.foreground
          }
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === "primary" && { color: colors.primaryForeground },
            variant === "secondary" && { color: colors.foreground },
            variant === "destructive" && { color: colors.primaryForeground },
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


  text: {
    fontSize: typography.md,
    fontWeight: "600",
  },


  pressed: {
    opacity: 0.8,
  },

  disabled: {
    opacity: 0.5,
  },
});
