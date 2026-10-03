import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";

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
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const selectedDate = parseDate(value);

  function handleDismiss() {
    setShowPicker(false);
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>

      <Pressable
        onPress={() => setShowPicker(true)}
        style={[styles.field, { borderColor: colors.input, backgroundColor: colors.background }, error ? { borderColor: colors.destructive } : null]}
      >
        <Text style={[styles.value, { color: colors.foreground }, !value ? { color: colors.mutedForeground } : null]}>
          {value ? formatDate(selectedDate) : "Select date"}
        </Text>

        <Text style={[styles.icon, { color: colors.mutedForeground }]}>▣</Text>
      </Pressable>

      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

      {showPicker ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={minimumDate}
          onValueChange={(event, date) => {
            if (!date) return;
            onChange(toISODate(date));
            setShowPicker(false);
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
    fontWeight: "500",  },

  field: {
    minHeight: 46,
    borderWidth: 1,    borderRadius: 10,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",  },
});
