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

import { useTasks } from "@/hooks/useTasks";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme";
import type { Task } from "@/types/task";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());

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
  const date = new Date(`${dateKey}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CalendarScreen() {
  const router = useRouter();
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
      if (!grouped[task.dueDate]) {
        grouped[task.dueDate] = [];
      }

      grouped[task.dueDate].push(task);
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.monthHeader}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.navButton}>
            <Text style={styles.navText}>‹</Text>
          </Pressable>

          <View style={styles.monthTitleContainer}>
            <Text style={styles.monthTitle}>
              {formatMonth(monthDate.getFullYear(), monthDate.getMonth())}
            </Text>

            <Pressable onPress={goToToday}>
              <Text style={styles.todayButton}>Today</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => changeMonth(1)} style={styles.navButton}>
            <Text style={styles.navText}>›</Text>
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
                style={[
                  styles.dayCell,
                  !isCurrentMonth && styles.outsideMonth,
                  isSelected && styles.selectedDay,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    !isCurrentMonth && styles.outsideMonthText,
                    isSelected && styles.selectedDayText,
                    isToday && !isSelected && styles.todayText,
                  ]}
                >
                  {date.getDate()}
                </Text>

                {dayTasks.length > 0 ? (
                  <View
                    style={[
                      styles.taskDot,
                      dayTasks.some((task) => task.status === "PENDING") &&
                        styles.pendingDot,
                    ]}
                  />
                ) : null}

                {dayTasks.length > 0 ? (
                  <Text
                    style={[
                      styles.taskCount,
                      isSelected && styles.selectedDayText,
                    ]}
                  >
                    {dayTasks.length}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.selectedSection}>
          <Text style={styles.sectionTitle}>
            {formatSelectedDate(selectedDate)}
          </Text>

          {loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="small" color={colors.foreground} />
              <Text style={styles.stateText}>Loading tasks...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : selectedTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No tasks due</Text>
              <Text style={styles.emptyText}>
                There are no tasks scheduled for this date.
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
                  <View style={styles.taskInfo}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.taskTitle,
                        task.status === "COMPLETED" &&
                          styles.completedTaskTitle,
                      ]}
                    >
                      {task.title}
                    </Text>

                    <Text style={styles.taskMeta}>
                      {task.category} • Due {task.dueDate}
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
                        task.priority === "HIGH" &&
                          styles.highPriorityText,
                      ]}
                    >
                      {task.priority}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
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

    monthHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
    },

    monthTitleContainer: {
      alignItems: "center",
      gap: spacing.xs,
    },

    monthTitle: {
      fontSize: typography.xl,
      fontWeight: "700",
      color: colors.foreground,
    },

    todayButton: {
      fontSize: typography.xs,
      fontWeight: "600",
      color: colors.mutedForeground,
    },

    navButton: {
      width: 42,
      height: 42,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    navText: {
      fontSize: 28,
      lineHeight: 30,
      color: colors.foreground,
    },

    weekHeader: {
      flexDirection: "row",
      marginBottom: spacing.sm,
    },

    weekday: {
      width: "14.2857%",
      textAlign: "center",
      fontSize: typography.xs,
      fontWeight: "600",
      color: colors.mutedForeground,
    },

    calendarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderColor: colors.border,
    },

    dayCell: {
      width: "14.2857%",
      height: 62,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      paddingTop: spacing.sm,
      backgroundColor: colors.card,
    },

    outsideMonth: {
      backgroundColor: colors.muted,
    },

    dayNumber: {
      fontSize: typography.sm,
      fontWeight: "500",
      color: colors.foreground,
    },

    outsideMonthText: {
      color: colors.mutedForeground,
    },

    todayText: {
      fontWeight: "800",
    },

    selectedDay: {
      backgroundColor: colors.primary,
    },

    selectedDayText: {
      color: colors.primaryForeground,
    },

    taskDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: spacing.xs,
      backgroundColor: colors.mutedForeground,
    },

    pendingDot: {
      backgroundColor: colors.destructive,
    },

    taskCount: {
      marginTop: 2,
      fontSize: 9,
      fontWeight: "700",
      color: colors.mutedForeground,
    },

    selectedSection: {
      marginTop: spacing.xxl,
    },

    sectionTitle: {
      fontSize: typography.lg,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: spacing.md,
    },

    taskList: {
      gap: spacing.md,
    },

    taskCard: {
      minHeight: 76,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
    },

    pressed: {
      opacity: 0.75,
    },

    taskInfo: {
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

    taskMeta: {
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },

    priorityBadge: {
      minWidth: 64,
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
      color: colors.foreground,
    },

    highPriorityText: {
      color: colors.primaryForeground,
    },

    stateContainer: {
      minHeight: 100,
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
      borderRadius: 14,
      padding: spacing.xl,
      alignItems: "center",
    },

    emptyTitle: {
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
  });
}
