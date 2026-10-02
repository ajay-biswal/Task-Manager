import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";
import type { TaskPriority } from "@/types/task";

interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
}

const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Priority</Text>

      <View style={styles.options}>
        {priorities.map((priority) => {
          const selected = priority === value;

          return (
            <Pressable
              key={priority}
              onPress={() => onChange(priority)}
              style={[styles.option, selected && styles.selected]}
            >
              <Text style={[styles.text, selected && styles.selectedText]}>
                {priority.charAt(0) + priority.slice(1).toLowerCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>
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

  options: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  option: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.light.background,
  },

  selected: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primary,
  },

  text: {
    fontSize: typography.sm,
    color: colors.light.foreground,
    fontWeight: "500",
  },

  selectedText: {
    color: colors.light.primaryForeground,
  },
});
