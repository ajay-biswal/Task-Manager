import {
    StyleSheet,
    Text,
    TextInput,
    View,
    type TextInputProps,
} from "react-native";

import { colors, spacing, typography } from "@/theme";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function AppInput({ label, error, ...props }: AppInputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        {...props}
        placeholderTextColor={colors.light.mutedForeground}
        style={[styles.input, error && styles.inputError]}
      />

      {error && <Text style={styles.error}>{error}</Text>}
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
    color: colors.light.foreground,
  },

  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.light.input,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: typography.md,
    color: colors.light.foreground,
    backgroundColor: colors.light.background,
  },

  inputError: {
    borderColor: colors.light.destructive,
  },

  error: {
    fontSize: typography.xs,
    color: colors.light.destructive,
  },
});
