import { CircularProgressIndicator, Host } from "@expo/ui/jetpack-compose";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/ui/AppIcon";
import { BottomNav } from "@/components/ui/BottomNav";
import { useTasks } from "@/hooks/useTasks";
import type { ThemeColors } from "@/theme";
import { spacing, typography } from "@/theme";
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
        />
      </Host>

      <View
        style={[
          stylesProgressRing.center,
          { backgroundColor: colors.card },
        ]}
      >
        <Text style={stylesProgressRing.text}>
          {Math.round(percent * 100)}%
        </Text>
      </View>
    </View>
  );
}

const stylesProgressRing = StyleSheet.create({
  container: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  host: {
    width: 130,
    height: 130,
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
    color: "#111111",
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
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { tasks, loading, error, refreshTasks } = useTasks();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.top);

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
          <Image
            source={require("../../assets/dashboard/dashboard-header.png")}
            style={styles.heroImage}
            resizeMode="contain"
          />

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
                onPress={() => router.push("/tasks")}
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
        </View>

        <View style={styles.statsRow}>
          <StatCard
            value={pendingTasks}
            label="Pending"
            icon={{ ios: "clock.fill", android: "schedule", web: "schedule" }}
            background="#FFFBF4"
            iconBackground="#FFF0D7"
            iconColor="#F59E0B"
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
            background="#F4FCF5"
            iconBackground="#DDF8E2"
            iconColor="#22C55E"
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
            background="#FFF6F7"
            iconBackground="#FFE1E5"
            iconColor="#EF4444"
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
          <Image
            source={require("../../assets/dashboard/productivity-banner.png")}
            style={styles.motivationImage}
            resizeMode="cover"
          />

          <View style={styles.quoteIcon}>
            <Text style={styles.quoteMark}>“</Text>
          </View>

          <Text style={styles.quoteText}>
            Small steps every day{"\n"}lead to big results.
          </Text>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function createStyles(colors: ThemeColors, topInset = 0) {
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
      height: 310,
      position: "relative",
      overflow: "hidden",
      marginHorizontal: -21,
      paddingHorizontal: 21,
    },

    heroImage: {
      position: "absolute",
      width: 480,
      height: 260,
      right: -42,
      bottom: -14,
    },

    heroTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingTop: 29,
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
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000000",
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 5 },
      elevation: 3,
    },

    progressCard: {
      minHeight: 255,
      marginTop: -2,
      padding: 28,
      borderRadius: 22,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: "#000000",
      shadowOpacity: 0.035,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 1,
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
      marginTop: 31,
      marginBottom: 39,
    },

    statCard: {
      flex: 1,
      height: 208,
      borderRadius: 22,
      borderWidth: 1,
      padding: 25,
      justifyContent: "flex-start",
    },

    statIcon: {
      width: 66,
      height: 66,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },

    statValue: {
      fontSize: 35,
      lineHeight: 40,
      fontWeight: "800",
      color: colors.foreground,
    },

    statLabel: {
      marginTop: 3,
      fontSize: 19,
      lineHeight: 25,
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
      minHeight: 425,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "#E4ECF7",
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      overflow: "hidden",
    },

    emptyImage: {
      width: "94%",
      height: 225,
      marginTop: -8,
      marginBottom: 2,
    },

    emptyTitle: {
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "800",
      color: colors.foreground,
    },

    emptyText: {
      marginTop: 12,
      textAlign: "center",
      fontSize: 18,
      lineHeight: 26,
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
      height: 184,
      marginTop: 39,
      borderRadius: 22,
      overflow: "hidden",
      backgroundColor: "#EFF6FF",
      borderWidth: 1,
      borderColor: "#DCEBFF",
      justifyContent: "center",
      paddingLeft: 37,
    },

    motivationImage: {
      position: "absolute",
      width: "100%",
      height: "100%",
      right: 0,
      top: 0,
    },

    quoteIcon: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: "#DCEBFF",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 15,
    },

    quoteMark: {
      marginTop: -7,
      fontSize: 39,
      lineHeight: 45,
      fontWeight: "800",
      color: colors.accent,
    },

    quoteText: {
      fontSize: 23,
      lineHeight: 31,
      fontWeight: "800",
      color: colors.foreground,
    },

    pressed: {
      opacity: 0.72,
    },
  });
}
