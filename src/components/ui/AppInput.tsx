import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function AppInput({ label, error, ...props }: AppInputProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
        </Text>
      ) : null}

      <TextInput
        {...props}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            borderColor: colors.input,
            color: colors.foreground,
            backgroundColor: colors.background,
          },
          error ? { borderColor: colors.destructive } : null,
        ]}
      />

      {error ? (
        <Text style={[styles.error, { color: colors.destructive }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },

  label: {
    fontSize: typography.sm,
    fontWeight: "500",
  },

  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: typography.md,
  },

  error: {
    fontSize: typography.xs,
  },
});
