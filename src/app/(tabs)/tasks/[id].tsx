import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TaskPriorityBadge, TaskStatusBadge } from "@/components/task";
import { AppIcon } from "@/components/ui/AppIcon";
import { Button, Card, Dialog, IconButton } from "@/components/ui";
import { useTasks } from "@/hooks/useTasks";
import type { ThemeColors } from "@/theme";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { Task } from "@/types/task";
import { formatDate, formatDateTime } from "@/utils/dateUtils";

type SectionIcon = {
  ios: string;
  android: string;
  web: string;
};

export default function TaskDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const taskId = typeof params.id === "string" ? params.id : undefined;

  const { findTask, removeTask, toggleTask } = useTasks();
  const { colors } = useTheme();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    actions?: Array<{
      label: string;
      variant?: "default" | "cancel" | "danger";
      onPress: () => void | Promise<void>;
    }>;
  } | null>(null);

  useEffect(() => {
    if (!taskId) {
      router.back();
      return;
    }

    const id = taskId;
    let active = true;

    async function loadTask() {
      try {
        const result = await findTask(id);

        if (!active) return;

        if (!result) {
          router.back();
          return;
        }

        setTask(result);
      } catch (error) {
        console.error("Failed to load task:", error);
        if (active) router.back();
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTask();

    return () => {
      active = false;
    };
  }, [taskId, findTask, router]);

  async function handleToggle() {
    if (!task) return;
    const nextStatus =
      task.status === "COMPLETED" ? "PENDING" : "COMPLETED";

    try {
      await toggleTask(task.id, nextStatus);
      setTask({
        ...task,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to update task status:", error);
      setDialog({
        title: "Update failed",
        message: "Unable to update the task status. Please try again.",
        actions: [{ label: "OK", onPress: () => setDialog(null) }],
      });
    }
  }

  function handleDelete() {
    if (!task) return;

    setDialog({
      title: "Delete task",
      message: `Delete "${task.title}"?`,
      actions: [
        {
          label: "Cancel",
          variant: "cancel",
          onPress: () => setDialog(null),
        },
        {
          label: "Delete",
          variant: "danger",
          onPress: async () => {
            setDialog(null);
            try {
              setDeleting(true);
              await removeTask(task.id);
              router.back();
            } catch (error) {
              console.error("Failed to delete task:", error);
              setDeleting(false);
              setDialog({
                title: "Delete failed",
                message: "Unable to delete the task. Please try again.",
                actions: [{ label: "OK", onPress: () => setDialog(null) }],
              });
            }
          },
        },
      ],
    });
  }

  function handleEdit() {
    if (task) {
      router.push(`/tasks/form?id=${task.id}`);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
          Loading task...
        </Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateTitle, { color: colors.foreground }]}>
          Task not found
        </Text>
        <Button title="Go back" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  const isCompleted = task.status === "COMPLETED";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <IconButton
            icon={
              <AppIcon
                name={{
                  ios: "chevron.left",
                  android: "arrow_back",
                  web: "arrow_back",
                }}
                size={21}
                color={colors.foreground}
              />
            }
            onPress={() => router.back()}
            accessibilityLabel="Back"
          />

          <Text style={[styles.screenTitle, { color: colors.foreground }]}>
            Task Details
          </Text>

          <IconButton
            icon={
              <AppIcon
                name={{ ios: "pencil", android: "edit", web: "edit" }}
                size={18}
                color={colors.foreground}
              />
            }
            onPress={handleEdit}
            accessibilityLabel="Edit task"
          />
        </View>

        <Card variant="outlined" padding="md">
          <View style={styles.summaryMain}>
            <Text
              style={[styles.title, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {task.title}
            </Text>

            <View style={styles.badges}>
              <TaskPriorityBadge priority={task.priority} />
              <TaskStatusBadge status={task.status} />
            </View>
          </View>
        </Card>

        {task.description ? (
          <SectionCard icon="description" title="Description" colors={colors}>
            <Text
              style={[styles.description, { color: colors.mutedForeground }]}
            >
              {task.description}
            </Text>
          </SectionCard>
        ) : null}

        <SectionCard icon="list_alt" title="Details" colors={colors}>
          <DetailRow
            icon="folder"
            label="Category"
            value={task.category}
            colors={colors}
          />
          <DetailRow
            icon="flag"
            label="Priority"
            value={capitalize(task.priority)}
            valueColor={getPriorityTextColor(task.priority, colors)}
            colors={colors}
          />
          <DetailRow
            icon="calendar_today"
            label="Start date"
            value={formatDate(task.startDate)}
            colors={colors}
          />
          <DetailRow
            icon="calendar_today"
            label="Due date"
            value={formatDate(task.dueDate)}
            colors={colors}
          />
          <DetailRow
            icon="schedule"
            label="Status"
            value={isCompleted ? "Completed" : "Pending"}
            colors={colors}
          />
        </SectionCard>

        <SectionCard icon="history" title="Activity" colors={colors}>
          <ActivityRow
            label="Created"
            value={formatDateTime(task.createdAt)}
            colors={colors}
          />
          <ActivityRow
            label="Last updated"
            value={formatDateTime(task.updatedAt)}
            colors={colors}
          />
        </SectionCard>
      </ScrollView>

      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.footerActions}>
          <Button
            title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
            onPress={handleToggle}
          />
          <Button title="Edit Task" onPress={handleEdit} variant="secondary" />
          <Button
            title="Delete Task"
            onPress={handleDelete}
            variant="danger"
            disabled={deleting}
            loading={deleting}
          />
        </View>
      </View>

      <Dialog
        visible={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message}
        actions={
          dialog?.actions ?? [{ label: "OK", onPress: () => setDialog(null) }]
        }
        onRequestClose={() => setDialog(null)}
      />
    </View>
  );
}

function SectionCard({
  icon,
  title,
  colors,
  children,
}: {
  icon: string;
  title: string;
  colors: ThemeColors;
  children: ReactNode;
}) {
  const iconName: SectionIcon = {
    ios:
      icon === "description"
        ? "doc.text"
        : icon === "list_alt"
          ? "list.bullet"
          : "clock.arrow.circlepath",
    android: icon,
    web: icon,
  };

  return (
    <Card variant="outlined" padding="md">
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.muted }]}>
          <AppIcon name={iconName} size={16} color={colors.accent} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {title}
        </Text>
      </View>

      {children}
    </Card>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueColor,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  colors: ThemeColors;
}) {
  const iconName = {
    ios:
      icon === "calendar_today"
        ? "calendar"
        : icon === "schedule"
          ? "clock"
          : icon === "folder"
            ? "folder"
            : "flag",
    android: icon,
    web: icon,
  };

  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <View style={styles.detailLeft}>
        <AppIcon name={iconName} size={15} color={colors.mutedForeground} />
        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>

      <Text
        style={[
          styles.detailValue,
          { color: valueColor ?? colors.foreground },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function ActivityRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.activityRow}>
      <Text style={[styles.activityLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.activityValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function capitalize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function getPriorityTextColor(
  priority: Task["priority"],
  colors: ThemeColors,
): string {
  if (priority === "HIGH") return colors.destructive;
  if (priority === "MEDIUM") return colors.accent;
  return colors.success;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },
  summaryMain: {
    gap: 10,
  },
  title: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "800",
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  detailRow: {
    minHeight: 42,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  detailValue: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "right",
  },
  activityRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  activityLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  activityValue: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "right",
    fontWeight: "600",
  },
  actionBar: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  footerActions: {
    gap: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: 20,
  },
  stateText: {
    fontSize: typography.sm,
  },
  stateTitle: {
    fontSize: typography.xl,
    fontWeight: "700",
  },
});
