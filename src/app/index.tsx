import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
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

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function TaskPreview({
  task,
  colors,
  onPress,
}: {
  task: Task;
  colors: ThemeColors;
  onPress: () => void;
}) {
  const styles = createStyles(colors);
  const overdue = isTaskOverdue(task);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.taskCard, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.statusDot,
          task.status === "COMPLETED"
            ? styles.completedStatusDot
            : styles.pendingStatusDot,
        ]}
      />

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

        <Text style={styles.taskMeta} numberOfLines={1}>
          {task.category} · {formatDate(task.dueDate)}
        </Text>

        {overdue ? <Text style={styles.overdueText}>Overdue</Text> : null}
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
    </Pressable>
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

  const todaysTasks = useMemo(
    () =>
      tasks
        .filter((task) => isToday(task.dueDate))
        .sort((a, b) => {
          if (a.status !== b.status) {
            return a.status === "PENDING" ? -1 : 1;
          }

          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .slice(0, 4),
    [tasks],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.title}>Your tasks, organized.</Text>
            <Text style={styles.subtitle}>
              Stay focused and keep your day moving.
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/settings")}
            style={({ pressed }) => [
              styles.settingsButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalTasks}</Text>
            <Text style={styles.statLabel}>Total tasks</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingTasks}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayTasks}</Text>
            <Text style={styles.statLabel}>Due today</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.overdueStatValue}>{overdueTasks}</Text>
            <Text style={styles.overdueStatLabel}>Overdue</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Today’s tasks</Text>
            <Text style={styles.sectionSubtitle}>
              {todayTasks === 0
                ? "Nothing due today"
                : `${todayTasks} task${todayTasks === 1 ? "" : "s"} due today`}
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/tasks")}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>Loading your tasks...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : todaysTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>✓</Text>
            </View>

            <Text style={styles.emptyTitle}>You’re all caught up</Text>

            <Text style={styles.emptyText}>
              No tasks are due today. Add one whenever you’re ready.
            </Text>

            <Pressable
              onPress={() => router.push("/tasks/form")}
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.emptyButtonText}>Create task</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.taskList}>
            {todaysTasks.map((task) => (
              <TaskPreview
                key={task.id}
                task={task}
                colors={colors}
                onPress={() => router.push(`/tasks/${task.id}`)}
              />
            ))}
          </View>
        )}

        <View style={styles.quickActionsHeader}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
        </View>

        <View style={styles.quickActions}>
          <AppButton
            title="Calendar"
            variant="secondary"
            onPress={() => router.push("/calendar")}
          />

          <AppButton
            title="Bulk import"
            variant="secondary"
            onPress={() => router.push("/bulk-upload")}
          />
        </View>

        <Pressable
          onPress={() => router.push("/tasks/form")}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addButtonText}>+ Add new task</Text>
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
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxxl,
    },

    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: spacing.xxl,
    },

    headerText: {
      flex: 1,
      marginRight: spacing.lg,
    },

    greeting: {
      fontSize: typography.sm,
      fontWeight: "600",
      color: colors.mutedForeground,
      marginBottom: spacing.xs,
    },

    title: {
      fontSize: typography.xxl,
      lineHeight: 30,
      fontWeight: "700",
      color: colors.foreground,
    },

    subtitle: {
      marginTop: spacing.sm,
      fontSize: typography.sm,
      lineHeight: 20,
      color: colors.mutedForeground,
    },

    settingsButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },

    settingsIcon: {
      fontSize: 19,
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
      minHeight: 96,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
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
      fontSize: typography.xs,
      fontWeight: "500",
      color: colors.mutedForeground,
    },

    overdueStatValue: {
      fontSize: typography.xxl,
      fontWeight: "700",
      color: colors.destructive,
    },

    overdueStatLabel: {
      fontSize: typography.xs,
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
      fontSize: typography.lg,
      fontWeight: "700",
      color: colors.foreground,
    },

    sectionSubtitle: {
      marginTop: spacing.xs,
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },

    viewAll: {
      fontSize: typography.sm,
      fontWeight: "600",
      color: colors.foreground,
    },

    taskList: {
      gap: spacing.sm,
    },

    taskCard: {
      minHeight: 78,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
    },

    statusDot: {
      width: 9,
      height: 9,
      borderRadius: 999,
      marginRight: spacing.md,
    },

    pendingStatusDot: {
      backgroundColor: colors.foreground,
    },

    completedStatusDot: {
      backgroundColor: colors.success,
    },

    taskContent: {
      flex: 1,
      marginRight: spacing.md,
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

    taskMeta: {
      marginTop: spacing.xs,
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },

    overdueText: {
      marginTop: spacing.xs,
      fontSize: typography.xs,
      fontWeight: "600",
      color: colors.destructive,
    },

    priorityBadge: {
      minWidth: 68,
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
      borderRadius: 16,
      padding: spacing.xxl,
      alignItems: "center",
      backgroundColor: colors.card,
    },

    emptyIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },

    emptyIconText: {
      fontSize: typography.lg,
      fontWeight: "700",
      color: colors.foreground,
    },

    emptyTitle: {
      fontSize: typography.lg,
      fontWeight: "700",
      color: colors.foreground,
    },

    emptyText: {
      marginTop: spacing.sm,
      maxWidth: 280,
      textAlign: "center",
      fontSize: typography.sm,
      lineHeight: 20,
      color: colors.mutedForeground,
    },

    emptyButton: {
      marginTop: spacing.lg,
      minHeight: 42,
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

    stateCard: {
      minHeight: 78,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
      backgroundColor: colors.card,
    },

    stateText: {
      fontSize: typography.sm,
      color: colors.mutedForeground,
    },

    errorText: {
      fontSize: typography.sm,
      color: colors.destructive,
    },

    quickActionsHeader: {
      marginTop: spacing.xxxl,
      marginBottom: spacing.md,
    },

    quickActions: {
      flexDirection: "row",
      gap: spacing.md,
    },

    addButton: {
      marginTop: spacing.md,
      minHeight: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },

    addButtonText: {
      fontSize: typography.md,
      fontWeight: "700",
      color: colors.primaryForeground,
    },

    pressed: {
      opacity: 0.8,
    },
  });
}
