import { CircularProgressIndicator, Host } from "@expo/ui/jetpack-compose";
import { size } from "@expo/ui/jetpack-compose/modifiers";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TaskCard } from "@/components/task";
import { AppIcon } from "@/components/ui/AppIcon";
import { Card, Dialog } from "@/components/ui";
import { useTasks } from "@/hooks/useTasks";
import { exportTasksToCsv } from "@/services/taskExport";
import type { ThemeColors } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
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

function formatToday(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function ProgressRing({
  progress,
  colors,
}: {
  progress: number;
  colors: ThemeColors;
}) {
  const percent = Math.max(0, Math.min(progress, 1));

  return (
    <View style={stylesProgressRing.container}>
      <View style={[stylesProgressRing.track, { borderColor: colors.muted }]} />
      <Host style={stylesProgressRing.host} matchContents>
        <CircularProgressIndicator
          progress={percent}
          color={colors.accent}
          trackColor="transparent"
          strokeWidth={11}
          strokeCap="round"
          modifiers={[size(124, 124)]}
        />
      </Host>

      <View
        style={[stylesProgressRing.center, { backgroundColor: colors.card }]}
      >
        <Text style={[stylesProgressRing.text, { color: colors.foreground }]}>
          {Math.round(percent * 100)}%
        </Text>
      </View>
    </View>
  );
}

const stylesProgressRing = StyleSheet.create({
  container: {
    width: 124,
    height: 124,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  host: {
    width: 124,
    height: 124,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "800",
  },
});

function StatCard({
  value,
  label,
  icon,
  background,
  iconBackground,
  iconColor,
  colors,
}: {
  value: number;
  label: string;
  icon: { ios: string; android: string; web: string };
  background: string;
  iconBackground: string;
  iconColor: string;
  colors: ThemeColors;
}) {
  const styles = createStyles(colors);

  return (
    <Card
      variant="outlined"
      padding="none"
      style={[
        styles.statCard,
        { backgroundColor: background },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: iconBackground }]}>
        <AppIcon name={icon} size={21} color={iconColor} />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { tasks, loading, error, refreshTasks, toggleTask, isTaskPending } = useTasks();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const styles = createStyles(colors, insets.top, width, isDark);
  const [exporting, setExporting] = useState(false);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshTasks();
    }, [refreshTasks]),
  );

  const { totalTasks, completedTasks, pendingTasks, overdueTasks } = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let overdue = 0;

    for (const task of tasks) {
      if (task.status === "COMPLETED") completed += 1;
      if (task.status === "PENDING") pending += 1;
      if (isTaskOverdue(task)) overdue += 1;
    }

    return {
      totalTasks: tasks.length,
      completedTasks: completed,
      pendingTasks: pending,
      overdueTasks: overdue,
    };
  }, [tasks]);

  const progress = totalTasks === 0 ? 0 : completedTasks / totalTasks;

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
        }),
    [tasks],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroText}>
              <Text style={styles.greeting}>{getGreeting()}, Ajay 👋</Text>
              <Text style={styles.heroTitle}>
                Have a productive{"\n"}day ahead.
              </Text>
              <Text style={styles.date}>{formatToday()}</Text>
            </View>

          </View>
        </View>

        <Card variant="outlined" padding="none" style={styles.progressCard}>
          <View style={styles.progressCopy}>
            <Text style={styles.progressTitle}>Task Progress</Text>

            <Text style={styles.progressCount}>
              {completedTasks} of {totalTasks}
            </Text>

            <Text style={styles.progressSubtitle}>tasks completed</Text>

            <View style={styles.progressBarRow}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.round(progress * 100)}%`,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>

              <Text style={styles.progressPercent}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          </View>

          <ProgressRing progress={progress} colors={colors} />
        </Card>

        <View style={styles.statsRow}>
          <StatCard
            value={pendingTasks}
            label="Pending"
            icon={{ ios: "clock.fill", android: "schedule", web: "schedule" }}
            background={isDark ? "#171A16" : "#FFF9EC"}
            iconBackground={isDark ? "#282515" : "#FFF0D7"}
            iconColor={isDark ? "#F59E0B" : "#F59E0B"}
            colors={colors}
          />

          <StatCard
            value={completedTasks}
            label="Completed"
            icon={{
              ios: "checkmark.circle.fill",
              android: "check_circle",
              web: "check_circle",
            }}
            background={isDark ? "#101B15" : "#F3FBF5"}
            iconBackground={isDark ? "#153521" : "#DDF8E2"}
            iconColor={colors.success}
            colors={colors}
          />

          <StatCard
            value={overdueTasks}
            label="Overdue"
            icon={{
              ios: "exclamationmark.circle.fill",
              android: "error",
              web: "error",
            }}
            background={isDark ? "#201418" : "#FFF3F5"}
            iconBackground={isDark ? "#351922" : "#FFE1E5"}
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
            accessibilityRole="button"
            accessibilityLabel="View all tasks"
          >
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </View>

        {loading ? (
          <Card variant="outlined" padding="none" style={styles.emptyCard}>
            <Text style={styles.stateText}>Loading your tasks...</Text>
          </Card>
        ) : error ? (
          <Card variant="outlined" padding="none" style={styles.emptyCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : todaysTasks.length === 0 ? (
          <Card variant="outlined" padding="none" style={styles.emptyCard}>
            <Image
              source={require("../../../assets/dashboard/empty-tasks.png")}
              style={styles.emptyImage}
              resizeMode="contain"
            />

            <Text style={styles.emptyTitle}>You’re all caught up!</Text>

            <Text style={styles.emptyText}>
              No tasks are due today.{"\n"}Enjoy your free time or add a new
              task.
            </Text>

          </Card>
        ) : (
          <View style={styles.taskList}>
            {todaysTasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                toggleDisabled={isTaskPending(task.id)}
                onToggle={(status) => {
                  toggleTask(task.id, status).catch((err) => {
                    console.error("Failed to update task status:", err);
                    setDialog({
                      title: "Update failed",
                      message: "Unable to update the task status. Please try again.",
                    });
                  });
                }}
                onPress={() => router.push(`/tasks/${task.id}`)}
              />
            ))}
          </View>
        )}

        <View style={styles.quickActions}>
          <Card
            onPress={() => router.push("/bulk-upload")}
            variant="outlined"
            padding="none"
            style={[styles.quickActionCard, { backgroundColor: isDark ? "#0D1420" : "#F2F7FD" }]}
          >
            <View
              style={[
                styles.quickActionIcon,
                { backgroundColor: isDark ? "#17243A" : "#E4EFFD" },
              ]}
            >
              <AppIcon
                name={{
                  ios: "arrow.down.doc",
                  android: "upload_file",
                  web: "upload_file",
                }}
                size={22}
                color={colors.accent}
              />
            </View>
            <Text style={styles.quickActionTitle}>Import</Text>
          </Card>

          <Card
            onPress={async () => {
              if (tasks.length === 0) {
                setDialog({
                  title: "No tasks",
                  message: "There are no tasks to export.",
                });
                return;
              }

              if (exporting) return;

              try {
                setExporting(true);
                await exportTasksToCsv(tasks);
              } catch (err) {
                console.error("Export failed:", err);
                setDialog({
                  title: "Export failed",
                  message: "Could not export your tasks. Please try again.",
                });
              } finally {
                setExporting(false);
              }
            }}
            variant="outlined"
            padding="none"
            style={[styles.quickActionCard, { backgroundColor: isDark ? "#111A15" : "#F3FBF5" }, exporting && styles.disabledAction]}
          >
            <View
              style={[
                styles.quickActionIcon,
                { backgroundColor: isDark ? "#16301F" : "#DDF8E2" },
              ]}
            >
              <AppIcon
                name={{
                  ios: "square.and.arrow.up",
                  android: "file_upload",
                  web: "file_upload",
                }}
                size={22}
                color={colors.success}
              />
            </View>
            <Text style={styles.quickActionTitle}>Export</Text>
          </Card>
        </View>
      </ScrollView>

      <Dialog
        visible={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message}
        actions={[
          {
            label: "OK",
            onPress: () => setDialog(null),
          },
        ]}
        onRequestClose={() => setDialog(null)}
      />
    </View>
  );
}

function createStyles(
  colors: ThemeColors,
  topInset = 0,
  screenWidth = 390,
  isDark = false,
) {
  const compact = screenWidth < 400;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 21,
      paddingTop: topInset,
      paddingBottom: 180,
    },
    hero: {
      height: compact ? 224 : 238,
      position: "relative",
      overflow: "hidden",
      marginHorizontal: -21,
      paddingHorizontal: 21,
    },
    heroTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingTop: compact ? 22 : 29,
    },
    heroText: {
      flex: 1,
      paddingRight: 12,
    },
    greeting: {
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    heroTitle: {
      marginTop: 9,
      fontSize: 39,
      lineHeight: 45,
      fontWeight: "800",
      letterSpacing: -0.9,
      color: colors.foreground,
    },
    date: {
      marginTop: 11,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "500",
      color: colors.mutedForeground,
    },

    progressCard: {
      minHeight: compact ? 184 : 194,
      marginTop: 0,
      padding: compact ? 20 : 24,
      borderRadius: 22,
      backgroundColor: isDark ? "#10141B" : colors.card,
      borderWidth: 1,
      borderColor: isDark ? "#202833" : colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: "#000000",
      shadowOpacity: 0.035,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 1,
    },
    progressChevron: {
      position: "absolute",
      top: 22,
      right: 22,
    },
    progressCopy: {
      flex: 1,
      paddingRight: 18,
    },
    progressTitle: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: "700",
      color: colors.foreground,
    },
    progressCount: {
      marginTop: 19,
      fontSize: 51,
      lineHeight: 56,
      fontWeight: "800",
      letterSpacing: -1.4,
      color: colors.foreground,
    },
    progressSubtitle: {
      marginTop: 2,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "500",
      color: colors.mutedForeground,
    },
    progressBarRow: {
      marginTop: 26,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    progressBarTrack: {
      flex: 1,
      height: 16,
      borderRadius: 999,
      backgroundColor: colors.muted,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      borderRadius: 999,
    },
    progressPercent: {
      width: 42,
      fontSize: 17,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    statsRow: {
      flexDirection: "row",
      gap: 14,
      marginTop: 18,
      marginBottom: 30,
    },
    statCard: {
      flex: 1,
      height: compact ? 148 : 188,
      borderRadius: compact ? 19 : 22,
      borderWidth: 1,
      padding: compact ? 18 : 22,
      justifyContent: "flex-start",
      minWidth: 0,
      position: "relative",
    },
    statIcon: {
      width: compact ? 50 : 66,
      height: compact ? 50 : 66,
      borderRadius: compact ? 16 : 18,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: compact ? 14 : 18,
    },
    statValue: {
      fontSize: compact ? 30 : 35,
      lineHeight: compact ? 35 : 40,
      fontWeight: "800",
      color: colors.foreground,
    },
    statChevron: {
      position: "absolute",
      top: compact ? 44 : 48,
      right: 16,
    },
    statLabel: {
      marginTop: 2,
      fontSize: compact ? 16 : 19,
      lineHeight: compact ? 21 : 25,
      fontWeight: "500",
      color: colors.mutedForeground,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 27,
      lineHeight: 33,
      fontWeight: "800",
      color: colors.foreground,
    },
    sectionSubtitle: {
      marginTop: 2,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "500",
      color: colors.mutedForeground,
    },
    viewAll: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "700",
      color: colors.accent,
    },
    emptyCard: {
      minHeight: compact ? 300 : isDark ? 350 : 330,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "#0D1219" : colors.card,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      overflow: "hidden",
    },
    emptyImage: {
      width: "88%",
      height: compact ? 132 : isDark ? 160 : 150,
      marginTop: -8,
      marginBottom: 4,
      opacity: isDark ? 0.9 : 1,
    },
    emptyTitle: {
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "800",
      color: colors.foreground,
    },
    emptyText: {
      marginTop: 10,
      textAlign: "center",
      fontSize: 17,
      lineHeight: 24,
      fontWeight: "500",
      color: colors.mutedForeground,
    },


    stateText: {
      fontSize: 16,
      color: colors.mutedForeground,
    },
    errorText: {
      fontSize: 16,
      color: colors.destructive,
      textAlign: "center",
    },
    taskList: {
      gap: 10,
    },





    quickActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 18,
    },
    quickActionCard: {
      flex: 1,
      minHeight: 104,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      gap: 10,
    },
    quickActionIcon: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    quickActionCopy: {
      flex: 1,
    },
    quickActionTitle: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "800",
      color: colors.foreground,
      textAlign: "center",
    },
    quickActionSubtitle: {
      marginTop: 2,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
      color: colors.mutedForeground,
    },
    pressed: {
      opacity: 0.72,
    },
    track: {
      position: "absolute",
      width: 124,
      height: 124,
      borderRadius: 62,
      borderWidth: 11,
    },
  });
}
