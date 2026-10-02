import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useTasks } from "@/hooks/useTasks";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme";
import type { Task, TaskPriority } from "@/types/task";
import { isTaskOverdue } from "@/utils/taskUtils";

type TaskFilter = "ALL" | "PENDING" | "COMPLETED";

type SortOption = "DUE_DATE" | "PRIORITY";

const priorityOrder: Record<TaskPriority, number> = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TaskCard({
  task,
  onToggle,
  onDelete,
  onPress,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const overdue = isTaskOverdue(task);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.taskCard, pressed && styles.pressed]}
    >
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        style={[
          styles.checkbox,
          task.status === "COMPLETED" && styles.checkboxCompleted,
        ]}
      >
        {task.status === "COMPLETED" ? (
          <Text style={styles.checkmark}>✓</Text>
        ) : null}
      </Pressable>

      <View style={styles.taskContent}>
        <Text
          numberOfLines={1}
          style={[
            styles.taskTitle,
            task.status === "COMPLETED" && styles.completedTitle,
          ]}
        >
          {task.title}
        </Text>

        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.category}>
            {task.category}
          </Text>

          <Text style={styles.separator}>•</Text>

          <Text style={styles.dueDate}>Due {formatDate(task.dueDate)}</Text>

          {overdue ? (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.overdueText}>OVERDUE</Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.rightSide}>
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
            {task.priority}
          </Text>
        </View>

        <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteButton}>
          <Text style={styles.deleteText}>×</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function TaskListScreen() {
  const router = useRouter();

  const { tasks, loading, error, toggleTask, removeTask, refreshTasks } = useTasks();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  useFocusEffect(
    useCallback(() => {
      refreshTasks();
    }, [refreshTasks]),
  );

  const [filter, setFilter] = useState<TaskFilter>("ALL");

  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState<SortOption>("DUE_DATE");

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = tasks.filter((task) => {
      const matchesFilter = filter === "ALL" || task.status === filter;

      const matchesSearch =
        !normalizedSearch ||
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.category.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "PRIORITY") {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      return (
        new Date(`${a.dueDate}T00:00:00`).getTime() -
        new Date(`${b.dueDate}T00:00:00`).getTime()
      );
    });
  }, [tasks, filter, search, sortBy]);

  function handleDelete(task: Task) {
    Alert.alert("Delete task", `Delete "${task.title}"?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await removeTask(task.id);
          } catch (error) {
            console.error("Failed to delete task:", error);
            Alert.alert("Delete failed", "Unable to delete this task.");
          }
        },
      },
    ]);
  }

  function handleToggle(task: Task) {
    const nextStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";

    toggleTask(task.id, nextStatus).catch((error) => {
      console.error("Failed to update task status:", error);
      Alert.alert("Update failed", "Unable to update the task status.");
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks</Text>

          <Text style={styles.subtitle}>
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/tasks/form")}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search tasks..."
        placeholderTextColor={colors.mutedForeground}
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        {(
          [
            ["ALL", "All"],
            ["PENDING", "Pending"],
            ["COMPLETED", "Completed"],
          ] as const
        ).map(([value, label]) => {
          const selected = filter === value;

          return (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={[styles.filterButton, selected && styles.selectedFilter]}
            >
              <Text
                style={[
                  styles.filterText,
                  selected && styles.selectedFilterText,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by</Text>

        <Pressable
          onPress={() => setSortBy("DUE_DATE")}
          style={[
            styles.sortButton,
            sortBy === "DUE_DATE" && styles.selectedSort,
          ]}
        >
          <Text
            style={[
              styles.sortText,
              sortBy === "DUE_DATE" && styles.selectedSortText,
            ]}
          >
            Due date
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSortBy("PRIORITY")}
          style={[
            styles.sortButton,
            sortBy === "PRIORITY" && styles.selectedSort,
          ]}
        >
          <Text
            style={[
              styles.sortText,
              sortBy === "PRIORITY" && styles.selectedSortText,
            ]}
          >
            Priority
          </Text>
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
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(task) => task.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onToggle={() => handleToggle(item)}
              onDelete={() => handleDelete(item)}
              onPress={() => router.push(`/tasks/${item.id}`)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            filteredTasks.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
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
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },

  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

  addButton: {
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },

  addButtonText: {
    fontSize: typography.sm,
    fontWeight: "600",
    color: colors.primaryForeground,
  },

  searchInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: typography.md,
    color: colors.foreground,
    backgroundColor: colors.background,
  },

  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  filterButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedFilter: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterText: {
    fontSize: typography.sm,
    fontWeight: "500",
    color: colors.foreground,
  },

  selectedFilterText: {
    color: colors.primaryForeground,
  },

  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  sortLabel: {
    marginRight: "auto",
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },

  sortButton: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    justifyContent: "center",
    backgroundColor: colors.muted,
  },

  selectedSort: {
    backgroundColor: colors.primary,
  },

  sortText: {
    fontSize: typography.xs,
    fontWeight: "500",
    color: colors.foreground,
  },

  selectedSortText: {
    color: colors.primaryForeground,
  },

  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  taskCard: {
    minHeight: 86,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
  },

  pressed: {
    opacity: 0.75,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 7,
    marginRight: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  checkmark: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryForeground,
  },

  taskContent: {
    flex: 1,
    marginRight: spacing.sm,
  },

  taskTitle: {
    fontSize: typography.md,
    fontWeight: "600",
    color: colors.foreground,
  },

  completedTitle: {
    textDecorationLine: "line-through",
    color: colors.mutedForeground,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },

  category: {
    maxWidth: 90,
    fontSize: typography.xs,
    color: colors.mutedForeground,
  },

  separator: {
    marginHorizontal: spacing.xs,
    fontSize: typography.xs,
    color: colors.mutedForeground,
  },

  dueDate: {
    fontSize: typography.xs,
    color: colors.mutedForeground,
  },

  overdueText: {
    fontSize: typography.xs,
    fontWeight: "700",
    color: colors.destructive,
  },

  rightSide: {
    alignItems: "flex-end",
    gap: spacing.sm,
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

  deleteButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteText: {
    fontSize: 22,
    lineHeight: 22,
    color: colors.mutedForeground,
  },

  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  stateText: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },

  errorText: {
    fontSize: typography.sm,
    color: colors.destructive,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.xxxl,
  },

  emptyTitle: {
    fontSize: typography.lg,
    fontWeight: "600",
    color: colors.foreground,
  },

  emptyText: {
    marginTop: spacing.sm,
    fontSize: typography.sm,
    color: colors.mutedForeground,
    textAlign: "center",
  },
});
}
