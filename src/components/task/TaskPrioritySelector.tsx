import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppIcon } from "@/components/ui/AppIcon";
import { useTheme } from "@/theme/ThemeContext";
import type { TaskPriority } from "@/types/task";

const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

type Props = {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
};

function priorityColor(priority: TaskPriority): string {
  if (priority === "LOW") return "#22C55E";
  if (priority === "MEDIUM") return "#EAB308";
  return "#EF4444";
}

export default function TaskPrioritySelector({ value, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {priorities.map((priority) => {
        const selected = value === priority;
        const color = priorityColor(priority);
        const icon =
          priority === "LOW"
            ? { ios: "arrow.down", android: "arrow_downward", web: "arrow_downward" }
            : priority === "MEDIUM"
              ? { ios: "equal", android: "drag_handle", web: "drag_handle" }
              : { ios: "arrow.up", android: "arrow_upward", web: "arrow_upward" };

        return (
          <Pressable
            key={priority}
            onPress={() => onChange(priority)}
            accessibilityRole="radio"
            accessibilityLabel={`${priority.toLowerCase()} priority`}
            accessibilityState={{ selected }}
            style={[
              styles.option,
              {
                backgroundColor: selected ? color + "14" : colors.muted,
                borderColor: selected ? color : colors.border,
              },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: color + "14" }]}>
              <AppIcon name={icon} size={18} color={color} />
            </View>
            <Text style={[styles.text, { color: colors.foreground }]}>
              {priority.charAt(0) + priority.slice(1).toLowerCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 9 },
  option: {
    flex: 1,
    minHeight: 72,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 11, lineHeight: 14, fontWeight: "700" },
});
