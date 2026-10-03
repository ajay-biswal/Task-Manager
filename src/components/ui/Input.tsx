import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { useTheme } from "@/theme/ThemeContext";

type InputProps = Omit<TextInputProps, "style"> & {
  label?: string;
  error?: string;
};

export default function Input({
  label,
  error,
  editable = true,
  multiline = false,
  numberOfLines,
  ...props
}: InputProps) {
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
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            color: colors.foreground,
            backgroundColor: colors.background,
            borderColor: error ? colors.destructive : colors.input,
          },
          multiline && styles.multiline,
          !editable && styles.disabled,
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
    gap: 7,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    fontSize: 12,
    fontWeight: "500",
  },
});
