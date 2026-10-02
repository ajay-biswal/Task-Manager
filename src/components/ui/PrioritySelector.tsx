import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { TaskPriority } from "@/types/task";

interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
}

const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.foreground }]}>Priority</Text>

      <View style={styles.options}>
        {priorities.map((priority) => {
          const selected = priority === value;

          return (
            <Pressable
              key={priority}
              onPress={() => onChange(priority)}
              style={[styles.option, { borderColor: colors.border, backgroundColor: colors.background }, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <Text style={[styles.text, { color: selected ? colors.primaryForeground : colors.foreground }]}>
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
    fontWeight: "500",  },

  options: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  option: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",  },

  text: {
    fontSize: typography.sm,    fontWeight: "500",
  },
});
