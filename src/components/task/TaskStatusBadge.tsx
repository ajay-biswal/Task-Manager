import { StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui";
import { useTheme } from "@/theme/ThemeContext";

type TaskStatus = "pending" | "in_progress" | "completed";

type TaskStatusBadgeProps = {
  status: TaskStatus;
};

const statusConfig: Record<
  TaskStatus,
  { label: string; variant: "default" | "info" | "success" }
> = {
  pending: {
    label: "Pending",
    variant: "default",
  },
  in_progress: {
    label: "In Progress",
    variant: "info",
  },
  completed: {
    label: "Completed",
    variant: "success",
  },
};

export default function TaskStatusBadge({
  status,
}: TaskStatusBadgeProps) {
  const { colors } = useTheme();
  const config = statusConfig[status];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor:
              status === "completed"
                ? colors.success
                : status === "in_progress"
                  ? colors.primary
                  : colors.mutedForeground,
          },
        ]}
      />
      <Badge label={config.label} variant={config.variant} />
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
});
