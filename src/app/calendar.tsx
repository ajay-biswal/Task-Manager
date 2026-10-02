import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomNavigation } from "@/components/BottomNavigation";
import { AppIcon } from "@/components/ui/AppIcon";
import { useTasks } from "@/hooks/useTasks";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme";
import type { Task } from "@/types/task";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function formatMonth(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function formatSelectedDate(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTaskDate(dateString: string): string {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks, loading, error, refreshTasks } = useTasks();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const todayKey = toDateKey(new Date());
  const [monthDate, setMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayKey);

  useFocusEffect(
    useCallback(() => {
      refreshTasks();
    }, [refreshTasks]),
  );

  const days = useMemo(
    () => getMonthDays(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate],
  );

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};

    for (const task of tasks) {
      (grouped[task.dueDate] ??= []).push(task);
    }

    return grouped;
  }, [tasks]);

  const selectedTasks = tasksByDate[selectedDate] ?? [];

  function changeMonth(offset: number) {
    setMonthDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  function goToToday() {
    const today = new Date();
    setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: 110 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Text style={styles.title}>Calendar</Text>

          <Pressable
            onPress={goToToday}
            style={({ pressed }) => [styles.todayButton, pressed && styles.pressed]}
          >
            <Text style={styles.todayText}>Today</Text>
          </Pressable>
        </View>

        <View style={styles.monthHeader}>
          <Pressable
            onPress={() => changeMonth(-1)}
            hitSlop={10}
            style={styles.arrowButton}
            accessibilityLabel="Previous month"
          >
            <AppIcon
              name={{ ios: "chevron.left", android: "chevron_left", web: "chevron_left" }}
              size={20}
              color={colors.foreground}
            />
          </Pressable>

          <Text style={styles.monthTitle}>
            {formatMonth(monthDate.getFullYear(), monthDate.getMonth())}
          </Text>

          <Pressable
            onPress={() => changeMonth(1)}
            hitSlop={10}
            style={styles.arrowButton}
            accessibilityLabel="Next month"
          >
            <AppIcon
              name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
              size={20}
              color={colors.foreground}
            />
          </Pressable>
        </View>

        <View style={styles.weekHeader}>
          {WEEKDAYS.map((day) => (
            <Text key={day} style={styles.weekday}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days.map((date) => {
            const dateKey = toDateKey(date);
            const isCurrentMonth = date.getMonth() === monthDate.getMonth();
            const isSelected = dateKey === selectedDate;
            const isToday = dateKey === todayKey;
            const dayTasks = tasksByDate[dateKey] ?? [];

            return (
              <Pressable
                key={dateKey}
                onPress={() => setSelectedDate(dateKey)}
                style={styles.dayCell}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isSelected && styles.selectedDayCircle,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      !isCurrentMonth && styles.outsideMonthText,
                      isSelected && styles.selectedDayText,
                      isToday && !isSelected && styles.todayNumber,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>

                <View style={styles.dots}>
                  {dayTasks.slice(0, 3).map((task) => (
                    <View
                      key={task.id}
                      style={[
                        styles.taskDot,
                        task.status === "COMPLETED"
                          ? styles.completedDot
                          : task.priority === "HIGH"
                            ? styles.highDot
                            : styles.pendingDot,
                      ]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.selectedSection}>
          <View style={styles.selectedHeader}>
            <Text style={styles.sectionTitle}>
              {formatSelectedDate(selectedDate)}
            </Text>
            <Text style={styles.taskCount}>
              {selectedTasks.length} {selectedTasks.length === 1 ? "task" : "tasks"}
            </Text>
          </View>

          {loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="small" color={colors.foreground} />
              <Text style={styles.stateText}>Loading tasks...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : selectedTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <AppIcon
                name={{ ios: "calendar", android: "calendar_month", web: "calendar" }}
                size={24}
                color={colors.mutedForeground}
              />
              <Text style={styles.emptyTitle}>No tasks for this day</Text>
              <Text style={styles.emptyText}>
                Select another date or create a new task.
              </Text>
            </View>
          ) : (
            <View style={styles.taskList}>
              {selectedTasks.map((task) => (
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

                  <View style={styles.taskInfo}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.taskTitle,
                        task.status === "COMPLETED" && styles.completedTaskTitle,
                      ]}
                    >
                      {task.title}
                    </Text>
                    <Text style={styles.taskMeta}>
                      {task.category} · {formatTaskDate(task.dueDate)}
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
                      {capitalize(task.priority)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

function capitalize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: spacing.lg,
    },
    topBar: {
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "700",
      color: colors.foreground,
    },
    todayButton: {
      minWidth: 58,
      minHeight: 34,
      paddingHorizontal: spacing.sm,
      borderRadius: 8,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    todayText: {
      fontSize: typography.xs,
      fontWeight: "700",
      color: colors.accent,
    },
    monthHeader: {
      marginTop: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    monthTitle: {
      fontSize: typography.md,
      fontWeight: "700",
      color: colors.foreground,
    },
    arrowButton: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    weekHeader: {
      flexDirection: "row",
      marginBottom: spacing.xs,
    },
    weekday: {
      width: "14.2857%",
      textAlign: "center",
      fontSize: 10,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    calendarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayCell: {
      width: "14.2857%",
      height: 52,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 3,
    },
    dayCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedDayCircle: {
      backgroundColor: colors.accent,
    },
    dayNumber: {
      fontSize: typography.xs,
      fontWeight: "500",
      color: colors.foreground,
    },
    outsideMonthText: {
      color: colors.mutedForeground,
      opacity: 0.45,
    },
    todayNumber: {
      fontWeight: "800",
    },
    selectedDayText: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    dots: {
      height: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    taskDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.mutedForeground,
    },
    pendingDot: {
      backgroundColor: colors.accent,
    },
    highDot: {
      backgroundColor: colors.destructive,
    },
    completedDot: {
      backgroundColor: colors.success,
    },
    selectedSection: {
      marginTop: spacing.xl,
    },
    selectedHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: typography.lg,
      fontWeight: "700",
      color: colors.foreground,
    },
    taskCount: {
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },
    taskList: {
      gap: spacing.sm,
    },
    taskCard: {
      minHeight: 68,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
    },
    statusCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      marginRight: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    pendingCircle: {
      borderWidth: 1.5,
      borderColor: colors.mutedForeground,
    },
    completedCircle: {
      backgroundColor: colors.success,
    },
    taskInfo: {
      flex: 1,
      marginRight: spacing.sm,
      gap: 2,
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
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },
    priorityBadge: {
      minWidth: 62,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
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
    stateContainer: {
      minHeight: 90,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    stateText: {
      fontSize: typography.sm,
      color: colors.mutedForeground,
    },
    errorText: {
      fontSize: typography.sm,
      color: colors.destructive,
    },
    emptyCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: spacing.xl,
      alignItems: "center",
      backgroundColor: colors.card,
    },
    emptyTitle: {
      marginTop: spacing.sm,
      fontSize: typography.md,
      fontWeight: "600",
      color: colors.foreground,
    },
    emptyText: {
      marginTop: spacing.xs,
      fontSize: typography.sm,
      textAlign: "center",
      color: colors.mutedForeground,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}
