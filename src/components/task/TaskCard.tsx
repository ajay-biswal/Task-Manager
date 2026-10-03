import { Pressable, StyleSheet, Text, View } from "react-native";

import Checkbox from "@/components/ui/Checkbox";
import TaskPriorityBadge from "@/components/task/TaskPriorityBadge";
import TaskStatusBadge from "@/components/task/TaskStatusBadge";
import { useTheme } from "@/theme/ThemeContext";
import type { Task, TaskStatus } from "@/types/task";
import { formatShortDate } from "@/utils/dateUtils";
import { isTaskOverdue } from "@/utils/taskUtils";

type TaskCardProps = {
  task: Task;
  onToggle: (status: TaskStatus) => void;
  onPress?: () => void;
};

export default function TaskCard({
  task,
  onToggle,
  onPress,
}: TaskCardProps) {
  const { colors } = useTheme();
  const completed = task.status === "COMPLETED";
  const overdue = isTaskOverdue(task);

  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <Checkbox
          checked={completed}
          onChange={() =>
            onToggle(completed ? "PENDING" : "COMPLETED")
          }
          label=""
        />

        <View style={styles.titleContainer}>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              { color: colors.foreground },
              completed && styles.completedTitle,
            ]}
          >
            {task.title}
          </Text>

          {task.description ? (
            <Text
              numberOfLines={2}
              style={[styles.description, { color: colors.mutedForeground }]}
            >
              {task.description}
            </Text>
          ) : null}

          <View style={styles.detailRow}>
            <Text
              numberOfLines={1}
              style={[styles.detail, { color: colors.mutedForeground }]}
            >
              {task.category}
            </Text>
            <Text style={[styles.separator, { color: colors.mutedForeground }]}>
              ·
            </Text>
            <Text
              style={[
                styles.detail,
                { color: overdue ? colors.destructive : colors.mutedForeground },
              ]}
            >
              Due {formatShortDate(task.dueDate)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.meta}>
        <TaskStatusBadge status={task.status} />
        <TaskPriorityBadge priority={task.priority} />
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={"Open task " + task.title}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  titleContainer: {
    flex: 1,
    paddingTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 21,
  },
  completedTitle: {
    textDecorationLine: "line-through",
    opacity: 0.55,
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  detail: {
    flexShrink: 1,
    fontSize: 11,
  },
  separator: {
    marginHorizontal: 5,
    fontSize: 11,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginLeft: 32,
  },
  pressed: {
    opacity: 0.82,
  },
});
