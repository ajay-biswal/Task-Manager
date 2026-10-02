import { CircularProgressIndicator, Host } from "@expo/ui/jetpack-compose";
import { size } from "@expo/ui/jetpack-compose/modifiers";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
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

import { AppIcon } from "@/components/ui/AppIcon";
import { BottomNav } from "@/components/ui/BottomNav";
import { useTasks } from "@/hooks/useTasks";
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
      <Host style={stylesProgressRing.host} matchContents>
        <CircularProgressIndicator
          progress={percent}
          color={colors.accent}
          trackColor={colors.muted}
          strokeWidth={11}
          strokeCap="round"
          modifiers={[size(124, 124)]}
        />
      </Host>

      <View
        style={[
          stylesProgressRing.center,
          { backgroundColor: colors.card },
        ]}
      >
        <Text
          style={[
            stylesProgressRing.text,
            { color: colors.foreground },
          ]}
        >
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
    <View
      style={[
        styles.statCard,
        { backgroundColor: background, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: iconBackground }]}>
        <AppIcon name={icon} size={21} color={iconColor} />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>

      <AppIcon
        name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
        size={18}
        color={colors.mutedForeground}
        style={styles.statChevron}
      />
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { tasks, loading, error, refreshTasks } = useTasks();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const styles = createStyles(colors, insets.top, width, isDark);

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
              <Text style={styles.greeting}>
                {getGreeting()}, Ajay 👋
              </Text>
              <Text style={styles.heroTitle}>
                Have a productive{"\n"}day ahead.
              </Text>
              <Text style={styles.date}>{formatToday()}</Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/tasks",
                    params: { focusSearch: "1" },
                  })
                }
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Search tasks"
              >
                <AppIcon
                  name={{ ios: "magnifyingglass", android: "search", web: "search" }}
                  size={22}
                  color={colors.foreground}
                />
              </Pressable>

              <Pressable
                onPress={() => router.push("/settings")}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
              >
                <AppIcon
                  name={{ ios: "gearshape", android: "settings", web: "settings" }}
                  size={22}
                  color={colors.foreground}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.progressCard}>
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

          <AppIcon
            name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
            size={20}
            color={colors.mutedForeground}
            style={styles.progressChevron}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            value={pendingTasks}
            label="Pending"
            icon={{ ios: "clock.fill", android: "schedule", web: "schedule" }}
            background={isDark ? "#171713" : "#FFF9EC"}
            iconBackground={isDark ? "#25220F" : "#FFF0D7"}
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
            background={isDark ? "#0C1D17" : "#F3FBF5"}
            iconBackground={isDark ? "#0B2B1D" : "#DDF8E2"}
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
            background={isDark ? "#211117" : "#FFF3F5"}
            iconBackground={isDark ? "#30151D" : "#FFE1E5"}
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
          <View style={styles.emptyCard}>
            <Text style={styles.stateText}>Loading your tasks...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : todaysTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Image
              source={require("../../assets/dashboard/empty-tasks.png")}
              style={styles.emptyImage}
              resizeMode="contain"
            />

            <Text style={styles.emptyTitle}>You’re all caught up!</Text>

            <Text style={styles.emptyText}>
              No tasks are due today.{"\n"}Enjoy your free time or add a new task.
            </Text>

            <Pressable
                onPress={() => router.push("/tasks/form")}
                style={({ pressed }) => [
                  styles.emptyAction,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Add a new task"
              >
                <AppIcon
                  name={{ ios: "plus", android: "add", web: "add" }}
                  size={22}
                  color="#FFFFFF"
                />
                <Text style={styles.emptyActionText}>Add a new task</Text>
              </Pressable>
          </View>
        ) : (
          <View style={styles.taskList}>
            {todaysTasks.slice(0, 3).map((task) => (
              <Pressable
                key={task.id}
                onPress={() => router.push(`/tasks/${task.id}`)}
                style={({ pressed }) => [
                  styles.taskCard,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.taskDot,
                    {
                      backgroundColor:
                        task.status === "COMPLETED"
                          ? colors.success
                          : colors.accent,
                    },
                  ]}
                />

                <View style={styles.taskCopy}>
                  <Text style={styles.taskTitle} numberOfLines={1}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskMeta} numberOfLines={1}>
                    {task.category} · {task.priority.toLowerCase()}
                  </Text>
                </View>

                <AppIcon
                  name={{
                    ios: "chevron.right",
                    android: "chevron_right",
                    web: "chevron_right",
                  }}
                  size={18}
                  color={colors.mutedForeground}
                />
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.motivationCard}>
  <View style={styles.quoteIcon}>
            <Text style={styles.quoteMark}>“</Text>
          </View>

          <Text style={styles.quoteText}>
            Small steps every day{"\n"}lead to big results.
          </Text>

          <AppIcon
            name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
            size={20}
            color={colors.mutedForeground}
          />
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function createStyles(colors: ThemeColors, topInset = 0, screenWidth = 390, isDark = false) {
  const compact = screenWidth < 400;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 21,
      paddingTop: topInset,
      paddingBottom: 132,
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
    headerActions: {
      flexDirection: "row",
      gap: 12,
    },
    headerButton: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: isDark ? "#11151B" : colors.card,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? "#242B35" : "transparent",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000000",
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 5 },
      elevation: 3,
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
      marginBottom: 17,
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
      minHeight: compact ? 320 : isDark ? 384 : 352,
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
      height: compact ? 145 : isDark ? 180 : 170,
      marginTop: -8,
      marginBottom: 2,
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
    emptyAction: {
      marginTop: 18,
      minWidth: 190,
      height: 48,
      paddingHorizontal: 20,
      borderRadius: 10,
      backgroundColor: colors.accent,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    emptyActionText: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "700",
      color: "#FFFFFF",
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
    taskCard: {
      minHeight: 72,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      gap: 12,
    },
    taskDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
    },
    taskCopy: {
      flex: 1,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
    },
    taskMeta: {
      marginTop: 3,
      fontSize: 13,
      color: colors.mutedForeground,
    },
    motivationCard: {
      height: compact ? 92 : 112,
      flexDirection: "row",
      alignItems: "center",
      marginTop: 22,
      borderRadius: 22,
      overflow: "hidden",
      backgroundColor: isDark ? "#0B1422" : "#F2F7FD",
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "space-between",
      paddingHorizontal: 22,
    },
    quoteIcon: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 0,
      marginRight: 16,
    },
    quoteMark: {
      marginTop: -7,
      fontSize: 39,
      lineHeight: 45,
      fontWeight: "800",
      color: colors.accent,
    },
    quoteText: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "800",
      color: colors.foreground,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
