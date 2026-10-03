import { StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme } from "@/theme/ThemeContext";

type InputProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
};

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 4,
  secureTextEntry = false,
  keyboardType = "default",
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
        accessibilityLabel={label}
        editable={!disabled}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.input,
          {
            color: colors.foreground,
            backgroundColor: colors.background,
            borderColor: error ? colors.destructive : colors.input,
          },
          multiline && styles.multiline,
          disabled && styles.disabled,
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
