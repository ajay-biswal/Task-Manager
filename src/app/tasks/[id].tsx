import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { useTasks } from "@/hooks/useTasks";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme";
import type { Task } from "@/types/task";

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function TaskDetailsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string;
  }>();

  const taskId = typeof params.id === "string" ? params.id : undefined;

  const { findTask, removeTask, toggleTask } = useTasks();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [task, setTask] = useState<Task | null>(null);

  const [loading, setLoading] = useState(true);

  const [deleting, setDeleting] = useState(false);

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

        if (!active) {
          return;
        }

        if (!result) {
          router.back();
          return;
        }

        setTask(result);
      } catch (error) {
        console.error("Failed to load task:", error);

        if (active) {
          router.back();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTask();

    return () => {
      active = false;
    };
  }, [taskId, findTask, router]);

  async function handleToggle() {
    if (!task) {
      return;
    }

    const nextStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";

    try {
      await toggleTask(task.id, nextStatus);

      setTask({
      ...task,
        status: nextStatus,
      });
    } catch (error) {
      console.error("Failed to update task status:", error);
      Alert.alert("Update failed", "Unable to update the task status.");
    }
  }

  function handleDelete() {
    if (!task) {
      return;
    }

    Alert.alert("Delete task", `Delete "${task.title}"?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);

            await removeTask(task.id);

            router.back();
          } catch (error) {
            console.error("Failed to delete task:", error);
            setDeleting(false);
          }
        },
      },
    ]);
  }

  function handleEdit() {
    if (!task) {
      return;
    }

    router.push(`/tasks/form?id=${task.id}`);
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.foreground} />

        <Text style={styles.stateText}>Loading task...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.stateTitle}>Task not found</Text>

        <AppButton title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>

        <View
          style={[
            styles.statusBadge,
            task.status === "COMPLETED" && styles.completedBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              task.status === "COMPLETED" && styles.completedStatusText,
            ]}
          >
            {task.status}
          </Text>
        </View>
      </View>

      {task.description ? (
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Description</Text>

          <Text style={styles.description}>{task.description}</Text>
        </View>
      ) : null}

      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Task Details</Text>

        <DetailRow label="Category" value={task.category} />

        <DetailRow label="Priority" value={task.priority} />

        <DetailRow label="Start date" value={formatDate(task.startDate)} />

        <DetailRow label="Due date" value={formatDate(task.dueDate)} />

        <DetailRow
          label="Created"
          value={formatDate(task.createdAt.slice(0, 10))}
        />

        <DetailRow
          label="Last updated"
          value={formatDate(task.updatedAt.slice(0, 10))}
        />
      </View>

      <View style={styles.actions}>
        <AppButton
          title={
            task.status === "COMPLETED"
              ? "Mark as Pending"
              : "Mark as Completed"
          }
          onPress={handleToggle}
        />

        <AppButton title="Edit Task" variant="secondary" onPress={handleEdit} />

        <AppButton
          title="Delete Task"
          variant="destructive"
          loading={deleting}
          onPress={handleDelete}
        />
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },

  header: {
    gap: spacing.md,
  },

  title: {
    fontSize: typography.xxxl,
    lineHeight: 36,
    fontWeight: "700",
    color: colors.foreground,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.muted,
  },

  completedBadge: {
    backgroundColor: colors.primary,
  },

  statusText: {
    fontSize: typography.xs,
    fontWeight: "600",
    color: colors.foreground,
  },

  completedStatusText: {
    color: colors.primaryForeground,
  },

  descriptionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.md,
  },

  detailsCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.lg,
  },

  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: "600",
    color: colors.foreground,
  },

  description: {
    fontSize: typography.md,
    lineHeight: 24,
    color: colors.mutedForeground,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  detailLabel: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },

  detailValue: {
    flex: 1,
    textAlign: "right",
    fontSize: typography.sm,
    fontWeight: "500",
    color: colors.foreground,
  },

  actions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },

  stateText: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },

  stateTitle: {
    fontSize: typography.xl,
    fontWeight: "600",
    color: colors.foreground,
  },
});
}
