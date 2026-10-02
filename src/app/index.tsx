import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppIcon } from "@/components/ui/AppIcon";
import { BottomNav } from "@/components/ui/BottomNav";
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
      <View style={styles.taskStatus}>
        <View
          style={[
            styles.statusCircle,
            task.status === "COMPLETED"
              ? styles.completedCircle
              : styles.pendingCircle,
          ]}
        >
          {task.status === "COMPLETED" ? (
            <AppIcon
              name={{ ios: "checkmark", android: "check", web: "check" }}
              size={13}
              color="#FFFFFF"
            />
          ) : null}
        </View>
      </View>

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
          {overdue ? " · Overdue" : ""}
        </Text>
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
          ]}
        >
          {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
        </Text>
      </View>
    </Pressable>
  );
}

function StatCard({
  value,
  label,
  icon,
  iconBackground,
  iconColor,
  colors,
}: {
  value: number;
  label: string;
  icon: { ios: string; android: string; web: string };
  iconBackground: string;
  iconColor: string;
  colors: ThemeColors;
}) {
  const styles = createStyles(colors);

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBackground }]}>
        <AppIcon name={icon} size={18} color={iconColor} />
      </View>

      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function QuickAction({
  title,
  icon,
  onPress,
  primary = false,
  colors,
}: {
  title: string;
  icon: { ios: string; android: string; web: string };
  onPress: () => void;
  primary?: boolean;
  colors: ThemeColors;
}) {
  const styles = createStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        primary && styles.primaryQuickAction,
        pressed && styles.pressed,
      ]}
    >
      <AppIcon
        name={icon}
        size={17}
        color={primary ? "#FFFFFF" : colors.foreground}
      />
      <Text
        style={[
          styles.quickActionText,
          primary && styles.primaryQuickActionText,
        ]}
      >
        {title}
      </Text>
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
        .slice(0, 3),
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
            <Text style={styles.title}>Here’s your task overview</Text>
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
            <AppIcon
              name={{ ios: "gearshape", android: "settings", web: "settings" }}
              size={20}
              color={colors.foreground}
            />
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            value={totalTasks}
            label="Total Tasks"
            icon={{ ios: "square.stack.3d.up.fill", android: "inventory_2", web: "inventory_2" }}
            iconBackground={colors.accent + "18"}
            iconColor={colors.accent}
            colors={colors}
          />

          <StatCard
            value={pendingTasks}
            label="Pending"
            icon={{ ios: "clock.fill", android: "schedule", web: "schedule" }}
            iconBackground="#F59E0B20"
            iconColor="#D97706"
            colors={colors}
          />

          <StatCard
            value={completedTasks}
            label="Completed"
            icon={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
            iconBackground="#22C55E20"
            iconColor="#16A34A"
            colors={colors}
          />

          <StatCard
            value={overdueTasks}
            label="Overdue"
            icon={{ ios: "exclamationmark.circle.fill", android: "error", web: "error" }}
            iconBackground="#EF444420"
            iconColor={colors.destructive}
            colors={colors}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Today’s tasks</Text>
            <Text style={styles.sectionSubtitle}>
              {todaysTasks.length} task{todaysTasks.length === 1 ? "" : "s"}
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
              <AppIcon
                name={{ ios: "checkmark", android: "check", web: "check" }}
                size={22}
                color={colors.accent}
              />
            </View>

            <Text style={styles.emptyTitle}>You’re all caught up</Text>

            <Text style={styles.emptyText}>
              No tasks are due today. Add one whenever you’re ready.
            </Text>
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

        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="New Task"
            icon={{ ios: "plus", android: "add", web: "add" }}
            primary
            onPress={() => router.push("/tasks/form")}
            colors={colors}
          />

          <QuickAction
            title="Calendar"
            icon={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
            onPress={() => router.push("/calendar")}
            colors={colors}
          />

          <QuickAction
            title="Bulk Import"
            icon={{ ios: "arrow.down.doc", android: "upload_file", web: "upload_file" }}
            onPress={() => router.push("/bulk-upload")}
            colors={colors}
          />

          <QuickAction
            title="Export"
            icon={{ ios: "square.and.arrow.up", android: "file_download", web: "file_download" }}
            onPress={() => router.push("/settings")}
            colors={colors}
          />
        </View>
      </ScrollView>

      <BottomNav />
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
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.xl,
    },

    headerText: {
      flex: 1,
      marginRight: spacing.md,
    },

    greeting: {
      fontSize: typography.lg,
      fontWeight: "700",
      color: colors.foreground,
    },

    title: {
      marginTop: spacing.xs,
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },

    settingsButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },

    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
      marginBottom: spacing.xl,
    },

    statCard: {
      width: "47%",
      minHeight: 96,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: spacing.md,
      justifyContent: "space-between",
      backgroundColor: colors.card,
    },

    statIcon: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },

    statValue: {
      fontSize: typography.xl,
      fontWeight: "700",
      color: colors.foreground,
    },

    statLabel: {
      marginTop: 1,
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },

    sectionTitle: {
      fontSize: typography.md,
      fontWeight: "700",
      color: colors.foreground,
    },

    sectionSubtitle: {
      marginTop: 2,
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },

    viewAll: {
      fontSize: typography.xs,
      fontWeight: "700",
      color: colors.accent,
    },

    taskList: {
      gap: spacing.sm,
    },

    taskCard: {
      minHeight: 64,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
    },

    taskStatus: {
      width: 26,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.sm,
    },

    statusCircle: {
      width: 19,
      height: 19,
      borderRadius: 999,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },

    pendingCircle: {
      borderColor: colors.mutedForeground,
    },

    completedCircle: {
      borderColor: colors.success,
      backgroundColor: colors.success,
    },

    taskContent: {
      flex: 1,
      marginRight: spacing.sm,
    },

    taskTitle: {
      fontSize: typography.sm,
      fontWeight: "600",
      color: colors.foreground,
    },

    completedTaskTitle: {
      textDecorationLine: "line-through",
      color: colors.mutedForeground,
    },

    taskMeta: {
      marginTop: 3,
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },

    priorityBadge: {
      minWidth: 56,
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      borderRadius: 8,
      alignItems: "center",
    },

    highPriority: {
      backgroundColor: colors.primary,
    },

    mediumPriority: {
      backgroundColor: colors.muted,
    },

    lowPriority: {
      backgroundColor: colors.muted,
    },

    priorityText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.foreground,
    },

    highPriorityText: {
      color: colors.primaryForeground,
    },

    emptyCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: spacing.xl,
      alignItems: "center",
      backgroundColor: colors.card,
    },

    emptyIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.accent + "18",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },

    emptyTitle: {
      fontSize: typography.md,
      fontWeight: "700",
      color: colors.foreground,
    },

    emptyText: {
      marginTop: spacing.xs,
      maxWidth: 260,
      textAlign: "center",
      fontSize: typography.xs,
      lineHeight: 18,
      color: colors.mutedForeground,
    },

    stateCard: {
      minHeight: 70,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
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
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },

    quickActionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },

    quickAction: {
      width: "48%",
      minHeight: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },

    primaryQuickAction: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },

    quickActionText: {
      fontSize: typography.xs,
      fontWeight: "600",
      color: colors.foreground,
    },

    primaryQuickActionText: {
      color: "#FFFFFF",
    },

    pressed: {
      opacity: 0.75,
    },
  });
}
