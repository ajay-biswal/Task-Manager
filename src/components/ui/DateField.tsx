import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";

interface DateFieldProps {
  label: string;
  value: string;
  error?: string;
  minimumDate?: Date;
  onChange: (value: string) => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseDate(value: string): Date {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function DateField({
  label,
  value,
  error,
  minimumDate,
  onChange,
}: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  const selectedDate = parseDate(value);

  function handleDismiss() {
    setShowPicker(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => setShowPicker(true)}
        style={[styles.field, error ? styles.fieldError : null]}
      >
        <Text style={[styles.value, !value ? styles.placeholder : null]}>
          {value ? formatDate(selectedDate) : "Select date"}
        </Text>

        <Text style={styles.icon}>▣</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {showPicker ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={minimumDate}
          onValueChange={(event, date) => {
            onChange(toISODate(date));
          }}
          onDismiss={handleDismiss}
        />
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
    color: colors.light.foreground,
  },

  field: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.light.input,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.light.background,
  },

  fieldError: {
    borderColor: colors.light.destructive,
  },

  value: {
    fontSize: typography.md,
    color: colors.light.foreground,
  },

  placeholder: {
    color: colors.light.mutedForeground,
  },

  icon: {
    fontSize: 17,
    color: colors.light.mutedForeground,
  },

  error: {
    fontSize: typography.xs,
    color: colors.light.destructive,
  },
});
