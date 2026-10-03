import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeContext";
import type { TaskStatus } from "@/types/task";

type TaskStatusBadgeProps = {
  status: TaskStatus;
};

const statusConfig: Record<
  TaskStatus,
  { label: string; dotColor: "success" | "primary" | "mutedForeground" }
> = {
  PENDING: {
    label: "Pending",
    dotColor: "mutedForeground",
  },
  COMPLETED: {
    label: "Completed",
    dotColor: "success",
  },
};

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const { colors } = useTheme();
  const config = statusConfig[status];

  const dotColor =
    config.dotColor === "success"
      ? colors.success
      : config.dotColor === "primary"
        ? colors.primary
        : colors.mutedForeground;

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View
        style={[
          styles.badge,
          {
            backgroundColor:
              status === "COMPLETED" ? colors.success + "18" : colors.muted,
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            {
              color:
                status === "COMPLETED"
                  ? colors.success
                  : colors.mutedForeground,
            },
          ]}
        >
          {config.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  badge: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
