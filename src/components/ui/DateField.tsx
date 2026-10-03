import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeContext";

type DateFieldProps = {
  label: string;
  value: string;
  error?: string;
  minimumDate?: Date;
  onChange: (value: string) => void;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseDate(value: string): Date {
  if (!value) return new Date();

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

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>

      <Pressable
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value ? formatDate(selectedDate) : "Select date"}`}
        style={[
          styles.field,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.destructive : colors.border,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.value,
            { color: value ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {value ? formatDate(selectedDate) : "Select date"}
        </Text>
        <Text style={[styles.icon, { color: colors.mutedForeground }]}>▣</Text>
      </Pressable>

      {error ? (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      ) : null}

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
          onDismiss={() => setShowPicker(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
  field: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  value: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
  },
  icon: {
    fontSize: 16,
  },
  error: {
    fontSize: 11,
    lineHeight: 15,
  },
});
