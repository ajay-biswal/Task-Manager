import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { useTasks } from "@/hooks/useTasks";
import type { ThemeColors } from "@/theme";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { Task } from "@/types/task";
import { isTaskOverdue } from "@/utils/taskUtils";

function isToday(dateString: string): boolean {
  const date = new Date(`${dateString}T00:00:00`);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TaskPreview({ task, colors }: { task: Task; colors: ThemeColors }) {
  const styles = createStyles(colors);

  return (
    <View style={styles.taskCard}>
      <View style={styles.taskContent}>
        <Text
          style={[
            styles.taskTitle,
            task.status === "COMPLETED" && styles.completedTaskTitle,
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>

        <Text style={styles.taskCategory} numberOfLines={1}>
          {task.category}
        </Text>

        <Text style={styles.taskDate}>Due {formatDate(task.dueDate)}</Text>
      </View>

      <View
        style={[
          styles.priorityBadge,
          task.priority === "HIGH" && styles.highPriority,
          task.priority === "MEDIUM" && styles.mediumPriority,
          task.priority === "LOW" && styles.lowPriority,
        ]}
      >
        <Text
          style={[
            styles.priorityText,
            task.priority === "HIGH" && styles.highPriorityText,
            task.priority === "MEDIUM" && styles.mediumPriorityText,
            task.priority === "LOW" && styles.lowPriorityText,
          ]}
        >
          {task.priority}
        </Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();

  const { tasks, loading, error, refreshTasks } = useTasks();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  useFocusEffect(
    useCallback(() => {
      refreshTasks();
    }, [refreshTasks]),
  );

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const pendingTasks = tasks.filter((task) => task.status === "PENDING").length;

  const todayTasks = tasks.filter((task) => isToday(task.dueDate)).length;

  const overdueTasks = tasks.filter((task) => isTaskOverdue(task)).length;

  const recentTasks = tasks.slice(0, 5);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>TaskFlow</Text>

            <Text style={styles.subtitle}>Manage your tasks efficiently.</Text>
          </View>

          <Pressable
            onPress={() => router.push("/settings")}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalTasks}</Text>

            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedTasks}</Text>

            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingTasks}</Text>

            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayTasks}</Text>

            <Text style={styles.statLabel}>Due Today</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.overdueStatValue}>{overdueTasks}</Text>

            <Text style={styles.overdueStatLabel}>Overdue</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Tasks</Text>

          <Pressable onPress={() => router.push("/tasks")}>
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>Loading tasks...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : recentTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No tasks yet</Text>

            <Text style={styles.emptyText}>
              Create your first task to get started.
            </Text>

            <Pressable
              onPress={() => router.push("/tasks/form")}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Create Task</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.taskList}>
            {recentTasks.map((task) => (
              <TaskPreview key={task.id} task={task} colors={colors} />
            ))}
          </View>
        )}

        <AppButton
          title="Bulk Upload"
          variant="secondary"
          onPress={() => router.push("/bulk-upload")}
        />

        <Pressable
          onPress={() => router.push("/tasks/form")}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ Add Task</Text>
        </Pressable>
      </ScrollView>
    </View>
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
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.xxl,
    },

    title: {
      fontSize: typography.xxxl,
      fontWeight: "700",
      color: colors.foreground,
    },

    subtitle: {
      marginTop: spacing.xs,
      fontSize: typography.sm,
      color: colors.mutedForeground,
    },

    settingsButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    settingsIcon: {
      fontSize: 20,
      color: colors.foreground,
    },

    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
      marginBottom: spacing.xxxl,
    },

    statCard: {
      width: "47%",
      minHeight: 110,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: spacing.lg,
      justifyContent: "space-between",
      backgroundColor: colors.card,
    },

    statValue: {
      fontSize: typography.xxl,
      fontWeight: "700",
      color: colors.foreground,
    },

    statLabel: {
      fontSize: typography.sm,
      color: colors.mutedForeground,
    },

    overdueStatValue: {
      fontSize: typography.xxl,
      fontWeight: "700",
      color: colors.destructive,
    },

    overdueStatLabel: {
      fontSize: typography.sm,
      fontWeight: "600",
      color: colors.destructive,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },

    sectionTitle: {
      fontSize: typography.xl,
      fontWeight: "600",
      color: colors.foreground,
    },

    viewAll: {
      fontSize: typography.sm,
      fontWeight: "600",
      color: colors.foreground,
    },

    taskList: {
      gap: spacing.md,
    },

    taskCard: {
      minHeight: 90,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
    },

    taskContent: {
      flex: 1,
      marginRight: spacing.md,
      gap: spacing.xs,
    },

    taskTitle: {
      fontSize: typography.md,
      fontWeight: "600",
      color: colors.foreground,
    },

    completedTaskTitle: {
      textDecorationLine: "line-through",
      color: colors.mutedForeground,
    },

    taskCategory: {
      fontSize: typography.sm,
      color: colors.mutedForeground,
    },

    taskDate: {
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },

    priorityBadge: {
      minWidth: 70,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: 999,
      alignItems: "center",
    },

    highPriority: {
      backgroundColor: colors.primary,
    },

    mediumPriority: {
      backgroundColor: colors.muted,
    },

    lowPriority: {
      backgroundColor: colors.border,
    },

    priorityText: {
      fontSize: typography.xs,
      fontWeight: "600",
    },

    highPriorityText: {
      color: colors.primaryForeground,
    },

    mediumPriorityText: {
      color: colors.foreground,
    },

    lowPriorityText: {
      color: colors.foreground,
    },

    emptyCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: spacing.xxl,
      alignItems: "center",
    },

    emptyTitle: {
      fontSize: typography.lg,
      fontWeight: "600",
      color: colors.foreground,
    },

    emptyText: {
      marginTop: spacing.sm,
      textAlign: "center",
      fontSize: typography.sm,
      color: colors.mutedForeground,
    },

    emptyButton: {
      marginTop: spacing.lg,
      minHeight: 44,
      borderRadius: 10,
      paddingHorizontal: spacing.xl,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },

    emptyButtonText: {
      fontSize: typography.sm,
      fontWeight: "600",
      color: colors.primaryForeground,
    },

    stateContainer: {
      padding: spacing.xxl,
      alignItems: "center",
    },

    stateText: {
      fontSize: typography.sm,
      color: colors.mutedForeground,
    },

    errorText: {
      fontSize: typography.sm,
      color: colors.destructive,
    },

    addButton: {
      marginTop: spacing.xxl,
      minHeight: 52,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },

    addButtonText: {
      fontSize: typography.md,
      fontWeight: "600",
      color: colors.primaryForeground,
    },
  });
}
