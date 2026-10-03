import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/ui/AppIcon";
import { Dialog } from "@/components/ui";
import { TaskCard } from "@/components/task";
import { useTasks } from "@/hooks/useTasks";
import type { ThemeColors } from "@/theme";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { Task, TaskPriority } from "@/types/task";
import { isTaskOverdue } from "@/utils/taskUtils";

type TaskFilter = "ALL" | "PENDING" | "COMPLETED" | "OVERDUE";
type SortOption = "DUE_DATE" | "PRIORITY";

const priorityOrder: Record<TaskPriority, number> = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function startOfDay(date = new Date()): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function getDayGroup(
  dateString: string,
): "Overdue" | "Today" | "Tomorrow" | "Later" {
  const dueDate = new Date(`${dateString}T00:00:00`);
  const today = startOfDay();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dueDate.getTime() < today.getTime()) {
    return "Overdue";
  }

  if (dueDate.getTime() === today.getTime()) {
    return "Today";
  }

  if (dueDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }

  return "Later";
}

export default function TaskListScreen() {
  const router = useRouter();
  const { focusSearch } = useLocalSearchParams<{ focusSearch?: string }>();
  const searchInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const { tasks, loading, error, toggleTask, refreshTasks, isTaskPending } = useTasks();
  const { colors } = useTheme();
  const styles = createStyles(colors, insets.top);

  const [filter, setFilter] = useState<TaskFilter>("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("DUE_DATE");
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (focusSearch !== "1") {
      return;
    }

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 250);

    return () => clearTimeout(timer);
  }, [focusSearch]);

  useFocusEffect(
    useCallback(() => {
      refreshTasks();
    }, [refreshTasks]),
  );

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tasks
      .filter((task) => {
        const matchesFilter =
          filter === "ALL" ||
          (filter === "OVERDUE"
            ? isTaskOverdue(task)
            : task.status === filter);
        const matchesSearch =
          !normalizedSearch ||
          task.title.toLowerCase().includes(normalizedSearch) ||
          task.category.toLowerCase().includes(normalizedSearch);

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "PRIORITY") {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }

        return (
          new Date(`${a.dueDate}T00:00:00`).getTime() -
          new Date(`${b.dueDate}T00:00:00`).getTime()
        );
      });
  }, [tasks, filter, search, sortBy]);

  const groups = useMemo(() => {
    const result: Array<{
      title: "Overdue" | "Today" | "Tomorrow" | "Later";
      tasks: Task[];
    }> = [
      { title: "Overdue", tasks: [] },
      { title: "Today", tasks: [] },
      { title: "Tomorrow", tasks: [] },
      { title: "Later", tasks: [] },
    ];

    for (const task of filteredTasks) {
      const group = result.find((item) => item.title === getDayGroup(task.dueDate));
      group?.tasks.push(task);
    }

    return result.filter((group) => group.tasks.length > 0);
  }, [filteredTasks]);

  const listData = groups.flatMap((group) => [
    { type: "header" as const, id: `header-${group.title}`, title: group.title, tasks: group.tasks },
    ...group.tasks.map((task) => ({
      type: "task" as const,
      id: task.id,
      task,
    })),
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Tasks</Text>
            <Text style={styles.subtitle}>
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"} · Stay consistent
            </Text>
          </View>


        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <AppIcon
              name={{ ios: "magnifyingglass", android: "search", web: "search" }}
              size={18}
              color={colors.mutedForeground}
            />

            <TextInput
              ref={searchInputRef}
              value={search}
              onChangeText={setSearch}
              placeholder="Search tasks..."
              placeholderTextColor={colors.mutedForeground}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>

          <Pressable
            onPress={() =>
              setSortBy((current) =>
                current === "DUE_DATE" ? "PRIORITY" : "DUE_DATE",
              )
            }
            style={({ pressed }) => [
              styles.filterIconButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              sortBy === "DUE_DATE" ? "Sort by priority" : "Sort by due date"
            }
          >
            <AppIcon
              name={{
                ios: "line.3.horizontal.decrease.circle",
                android: "filter_list",
                web: "filter_list",
              }}
              size={20}
              color={colors.foreground}
            />
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {(
            [
              ["ALL", "All"],
              ["PENDING", "Pending"],
              ["COMPLETED", "Completed"],
              ["OVERDUE", "Overdue"],
            ] as const
          ).map(([value, label]) => {
            const selected = filter === value;

            return (
              <Pressable
                key={value}
                onPress={() => setFilter(value)}
                style={[styles.filterButton, selected && styles.selectedFilter]}
              >
                <Text style={[styles.filterText, selected && styles.selectedFilterText]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>Loading tasks...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            item.type === "header" ? (
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{item.title}</Text>
                <Text style={styles.groupCount}>
                  {item.tasks.length} {item.tasks.length === 1 ? "task" : "tasks"}
                </Text>
              </View>
            ) : (
              <TaskCard
                task={item.task}
                toggleDisabled={isTaskPending(item.task.id)}
                onToggle={(status) => {
                  toggleTask(item.task.id, status).catch((error) => {
                    console.error("Failed to update task status:", error);
                    setDialog({
                      title: "Update failed",
                      message: "Unable to update the task status. Please try again.",
                    });
                  });
                }}
                onPress={() => router.push(`/tasks/${item.task.id}`)}
              />
            )
          }
          contentContainerStyle={[
            styles.listContent,
            listData.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <AppIcon
                  name={{
                    ios: "checklist",
                    android: "checklist",
                    web: "checklist",
                  }}
                  size={24}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptyText}>
                {search
                  ? "Try a different search."
                  : "Create a task to get started."}
              </Text>
            </View>
          }
        />
      )}
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

function createStyles(colors: ThemeColors, topInset = 0) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: topInset + 18,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },

    title: {
      fontSize: 28,
      lineHeight: 32,
      fontWeight: "800",
      color: colors.foreground,
    },

    subtitle: {
      marginTop: 3,
      fontSize: 13,
      color: colors.mutedForeground,
    },

    searchRow: { flexDirection: "row", gap: 8 },

    searchBox: {
      flex: 1,
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
    },

    searchInput: {
      flex: 1,
      minHeight: 42,
      paddingVertical: 0,
      fontSize: 13,
      color: colors.foreground,
    },

    filterIconButton: {
      width: 44,
      minHeight: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
    },

    filterRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
      paddingBottom: 13,
    },

    filterButton: {
      flex: 1,
      minHeight: 36,
      paddingHorizontal: 6,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
    },

    selectedFilter: { backgroundColor: colors.accent, borderColor: colors.accent },

    filterText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.foreground,
    },

    selectedFilterText: { color: "#FFFFFF" },

    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 124,
      gap: 8,
    },

    emptyListContent: { flexGrow: 1 },

    groupHeader: {
      minHeight: 34,
      marginTop: 7,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    groupTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.foreground,
    },

    groupCount: {
      fontSize: 12,
      color: colors.mutedForeground,
    },

    taskCard: {
      minHeight: 70,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 13,
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },

    checkbox: {
      width: 21,
      height: 21,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: colors.mutedForeground,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    checkboxCompleted: {
      borderColor: colors.success,
      backgroundColor: colors.success,
    },

    taskMain: { flex: 1, minWidth: 0, marginRight: 9 },

    taskTitle: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
      color: colors.foreground,
    },

    completedTitle: {
      textDecorationLine: "line-through",
      color: colors.mutedForeground,
    },

    taskMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5,
      minWidth: 0,
    },

    categoryDot: {
      width: 7,
      height: 7,
      borderRadius: 999,
      marginRight: 5,
    },

    taskMeta: {
      fontSize: 11,
      color: colors.mutedForeground,
    },

    metaSeparator: {
      marginHorizontal: 5,
      fontSize: 11,
      color: colors.mutedForeground,
    },

    overdueMeta: { color: colors.destructive },

    priorityBadge: {
      minWidth: 46,
      paddingVertical: 7,
      paddingHorizontal: 8,
      borderRadius: 8,
      alignItems: "center",
    },

    highPriority: { backgroundColor: colors.destructive + "18" },
    mediumPriority: { backgroundColor: "#F59E0B20" },
    lowPriority: { backgroundColor: colors.muted },

    priorityText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.mutedForeground,
    },

    highPriorityText: { color: colors.destructive },
    mediumPriorityText: { color: "#D97706" },

    stateContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    stateText: { fontSize: typography.sm, color: colors.mutedForeground },
    errorText: { fontSize: typography.sm, color: colors.destructive },

    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: spacing.xxxl,
    },

    emptyIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent + "18",
    },

    emptyTitle: {
      marginTop: spacing.md,
      fontSize: typography.md,
      fontWeight: "700",
      color: colors.foreground,
    },

    emptyText: {
      marginTop: spacing.xs,
      fontSize: typography.sm,
      color: colors.mutedForeground,
      textAlign: "center",
    },

    pressed: { opacity: 0.75 },
  });
}
