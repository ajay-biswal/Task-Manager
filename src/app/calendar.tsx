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

import { AppIcon } from "@/components/ui/AppIcon";
import { BottomNav } from "@/components/ui/BottomNav";
import { useTasks } from "@/hooks/useTasks";
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

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
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

function capitalize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
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
          {
            paddingTop: insets.top + 18,
            paddingBottom: 130 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>

          <Pressable
            onPress={goToToday}
            style={({ pressed }) => [
              styles.todayButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go to today"
          >
            <Text style={styles.todayText}>Today</Text>
          </Pressable>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.monthRow}>
            <Pressable
              onPress={() => changeMonth(-1)}
              style={({ pressed }) => [
                styles.monthControl,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <AppIcon
                name={{
                  ios: "chevron.left",
                  android: "chevron_left",
                  web: "chevron_left",
                }}
                size={21}
                color={colors.foreground}
              />
            </Pressable>

            <Text style={styles.monthTitle}>
              {formatMonth(monthDate.getFullYear(), monthDate.getMonth())}
            </Text>

            <Pressable
              onPress={() => changeMonth(1)}
              style={({ pressed }) => [
                styles.monthControl,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <AppIcon
                name={{
                  ios: "chevron.right",
                  android: "chevron_right",
                  web: "chevron_right",
                }}
                size={21}
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
                  style={({ pressed }) => [
                    styles.dayCell,
                    pressed && styles.dayPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${date.toDateString()}`}
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
        </View>

        <View style={styles.selectedSection}>
          <View style={styles.selectedHeader}>
            <Text style={styles.sectionTitle}>
              {formatSelectedDate(selectedDate)}
            </Text>
            <Text style={styles.taskCount}>
              {selectedTasks.length}{" "}
              {selectedTasks.length === 1 ? "task" : "tasks"}
            </Text>
          </View>

          {loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.stateText}>Loading tasks...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : selectedTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <AppIcon
                name={{
                  ios: "calendar",
                  android: "calendar_month",
                  web: "calendar",
                }}
                size={28}
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
                  accessibilityRole="button"
                  accessibilityLabel={`Open task ${task.title}`}
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
                        name={{
                          ios: "checkmark",
                          android: "check",
                          web: "check",
                        }}
                        size={14}
                        color="#FFFFFF"
                      />
                    ) : null}
                  </View>

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

                  <AppIcon
                    name={{
                      ios: "chevron.right",
                      android: "chevron_right",
                      web: "chevron_right",
                    }}
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              ))}
            </View>
          )}
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
      paddingHorizontal: 22,
    },
    header: {
      minHeight: 76,
      marginBottom: 4,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: 31,
      lineHeight: 37,
      fontWeight: "800",
      letterSpacing: -0.6,
      color: colors.foreground,
    },

    todayButton: {
      minWidth: 96,
      height: 56,
      paddingHorizontal: 18,
      borderRadius: 17,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    todayText: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.accent,
    },
    controlButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000000",
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    calendarCard: {
      paddingHorizontal: 2,
      paddingTop: 4,
      paddingBottom: 8,
    },
    monthRow: {
      height: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    monthControl: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    monthTitle: {
      fontSize: 25,
      lineHeight: 31,
      fontWeight: "800",
      color: colors.foreground,
    },
    weekHeader: {
      flexDirection: "row",
      marginBottom: 8,
    },
    weekday: {
      width: "14.2857%",
      textAlign: "center",
      fontSize: 14,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    calendarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayCell: {
      width: "14.2857%",
      height: 61,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 2,
    },
    dayCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedDayCircle: {
      backgroundColor: colors.accent,
    },
    dayNumber: {
      fontSize: 17,
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
      marginTop: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
    },
    taskDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
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
      marginTop: 34,
    },
    selectedHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginBottom: 18,
      paddingHorizontal: 2,
    },
    sectionTitle: {
      fontSize: 25,
      lineHeight: 31,
      fontWeight: "800",
      color: colors.foreground,
    },
    taskCount: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    taskList: {
      gap: 12,
    },
    taskCard: {
      minHeight: 112,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 19,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      shadowColor: "#000000",
      shadowOpacity: 0.035,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    statusCircle: {
      width: 39,
      height: 39,
      borderRadius: 20,
      marginRight: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    pendingCircle: {
      borderWidth: 2,
      borderColor: colors.mutedForeground,
    },
    completedCircle: {
      backgroundColor: colors.success,
    },
    taskInfo: {
      flex: 1,
      marginRight: 10,
      gap: 4,
    },
    taskTitle: {
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "700",
      color: colors.foreground,
    },
    completedTaskTitle: {
      textDecorationLine: "line-through",
      color: colors.mutedForeground,
    },
    taskMeta: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.mutedForeground,
    },
    priorityBadge: {
      minWidth: 78,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 14,
      alignItems: "center",
      marginRight: 8,
    },
    highPriority: {
      backgroundColor: colors.destructive,
    },
    mediumPriority: {
      backgroundColor: colors.muted,
    },
    lowPriority: {
      backgroundColor: colors.muted,
    },
    priorityText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.foreground,
    },
    highPriorityText: {
      color: "#FFFFFF",
    },
    stateContainer: {
      minHeight: 150,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    stateText: {
      fontSize: 16,
      color: colors.mutedForeground,
    },
    errorText: {
      fontSize: 16,
      color: colors.destructive,
      paddingHorizontal: 4,
    },
    emptyCard: {
      minHeight: 145,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 19,
      padding: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    emptyTitle: {
      marginTop: 10,
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
    },
    emptyText: {
      marginTop: 5,
      fontSize: 15,
      lineHeight: 21,
      textAlign: "center",
      color: colors.mutedForeground,
    },
    pressed: {
      opacity: 0.75,
    },
    dayPressed: {
      opacity: 0.65,
    },
  });
}
