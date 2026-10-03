import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppIcon } from "@/components/ui/AppIcon";
import { useTheme } from "@/theme/ThemeContext";
import type { TaskStatus } from "@/types/task";

const statuses: TaskStatus[] = ["PENDING", "COMPLETED"];

type Props = {
  value: TaskStatus;
  onChange: (value: TaskStatus) => void;
};

export default function TaskStatusSelector({ value, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {statuses.map((status) => {
        const selected = value === status;
        const isPending = status === "PENDING";

        return (
          <Pressable
            key={status}
            onPress={() => onChange(status)}
            accessibilityRole="radio"
            accessibilityLabel={isPending ? "Pending" : "Completed"}
            accessibilityState={{ selected }}
            style={[
              styles.option,
              {
                backgroundColor: selected ? colors.accent + "12" : colors.muted,
                borderColor: selected ? colors.accent : colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.icon,
                {
                  backgroundColor: selected ? colors.accent + "18" : colors.background,
                },
              ]}
            >
              <AppIcon
                name={
                  isPending
                    ? { ios: "clock", android: "schedule", web: "schedule" }
                    : {
                        ios: "checkmark.circle.fill",
                        android: "check_circle",
                        web: "check_circle",
                      }
                }
                size={20}
                color={selected ? colors.accent : colors.mutedForeground}
              />
            </View>
            <Text style={[styles.text, { color: colors.foreground }]}>
              {isPending ? "Pending" : "Completed"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  option: {
    flex: 1,
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 10,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 12, lineHeight: 16, fontWeight: "700" },
});
