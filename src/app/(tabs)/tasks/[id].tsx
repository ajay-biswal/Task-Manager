import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/ui/AppIcon";
import { useTasks } from "@/hooks/useTasks";
import type { ThemeColors } from "@/theme";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { Task } from "@/types/task";

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TaskDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const taskId = typeof params.id === "string" ? params.id : undefined;

  const { findTask, removeTask, toggleTask } = useTasks();
  const { colors } = useTheme();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!taskId) {
      router.back();
      return;
    }

    const id = taskId;
    let active = true;

    async function loadTask() {
      try {
        const result = await findTask(id);

        if (!active) {
          return;
        }

        if (!result) {
          router.back();
          return;
        }

        setTask(result);
      } catch (error) {
        console.error("Failed to load task:", error);

        if (active) {
          router.back();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTask();

    return () => {
      active = false;
    };
  }, [taskId, findTask, router]);

  async function handleToggle() {
    if (!task) {
      return;
    }

    const nextStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";

    try {
      await toggleTask(task.id, nextStatus);
      setTask({
        ...task,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to update task status:", error);
      Alert.alert("Update failed", "Unable to update the task status.");
    }
  }

  function handleDelete() {
    if (!task) {
      return;
    }

    Alert.alert("Delete task", `Delete "${task.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            await removeTask(task.id);
            router.back();
          } catch (error) {
            console.error("Failed to delete task:", error);
            setDeleting(false);
            Alert.alert("Delete failed", "Unable to delete the task.");
          }
        },
      },
    ]);
  }

  function handleEdit() {
    if (task) {
      router.push(`/tasks/form?id=${task.id}`);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
          Loading task...
        </Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateTitle, { color: colors.foreground }]}>
          Task not found
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.link, { color: colors.accent }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isCompleted = task.status === "COMPLETED";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.topIconButton,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <AppIcon
              name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
              size={21}
              color={colors.foreground}
            />
          </Pressable>

          <Text style={[styles.screenTitle, { color: colors.foreground }]}>
            Task
          </Text>

          <Pressable
            onPress={handleEdit}
            style={[
              styles.topIconButton,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Edit task"
          >
            <AppIcon
              name={{ ios: "pencil", android: "edit", web: "edit" }}
              size={18}
              color={colors.foreground}
            />
          </Pressable>
        </View>

        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.summaryMain}>
            <Text
              style={[styles.title, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {task.title}
            </Text>

            <View style={styles.badges}>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityBackground(task.priority, colors) },
                ]}
              >
                <AppIcon
                  name={{ ios: "exclamationmark.circle.fill", android: "priority_high", web: "priority_high" }}
                  size={12}
                  color={getPriorityTextColor(task.priority, colors)}
                />
                <Text
                  style={[
                    styles.priorityText,
                    { color: getPriorityTextColor(task.priority, colors) },
                  ]}
                >
                  {capitalize(task.priority)}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: colors.muted },
                ]}
              >
                <AppIcon
                  name={
                    isCompleted
                      ? { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }
                      : { ios: "clock", android: "schedule", web: "schedule" }
                  }
                  size={12}
                  color={colors.mutedForeground}
                />
                <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                  {isCompleted ? "Completed" : "Pending"}
                </Text>
              </View>
            </View>
          </View>

        </View>

        {task.description ? (
          <SectionCard icon="description" title="Description" colors={colors}>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {task.description}
            </Text>
          </SectionCard>
        ) : null}

        <SectionCard icon="list_alt" title="Details" colors={colors}>
          <DetailRow icon="folder" label="Category" value={task.category} colors={colors} />
          <DetailRow
            icon="flag"
            label="Priority"
            value={capitalize(task.priority)}
            valueColor={getPriorityTextColor(task.priority, colors)}
            colors={colors}
          />
          <DetailRow icon="calendar_today" label="Start date" value={formatDate(task.startDate)} colors={colors} />
          <DetailRow icon="calendar_today" label="Due date" value={formatDate(task.dueDate)} colors={colors} />
          <DetailRow
            icon="schedule"
            label="Status"
            value={isCompleted ? "Completed" : "Pending"}
            colors={colors}
          />
        </SectionCard>

        <SectionCard icon="history" title="Activity" colors={colors}>
          <ActivityRow label="Created" value={formatDateTime(task.createdAt)} colors={colors} />
          <ActivityRow label="Last updated" value={formatDateTime(task.updatedAt)} colors={colors} />
        </SectionCard>

        <View style={styles.actions}>
          <Pressable
            onPress={handleToggle}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.accent },
              pressed && styles.pressed,
            ]}
          >
            <AppIcon
              name={
                isCompleted
                  ? { ios: "arrow.uturn.backward", android: "undo", web: "undo" }
                  : { ios: "checkmark", android: "check", web: "check" }
              }
              size={17}
              color="#FFFFFF"
            />
            <Text style={styles.primaryButtonText}>
              {isCompleted ? "Mark as Pending" : "Mark as Completed"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleEdit}
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <AppIcon
              name={{ ios: "pencil", android: "edit", web: "edit" }}
              size={16}
              color={colors.foreground}
            />
            <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
              Edit Task
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            style={({ pressed }) => [
              styles.deleteButton,
              {
                backgroundColor: colors.destructive + "12",
                borderColor: colors.destructive,
              },
              pressed && styles.pressed,
            ]}
          >
            {deleting ? (
              <ActivityIndicator color={colors.destructive} />
            ) : (
              <>
                <AppIcon
                  name={{ ios: "trash", android: "delete", web: "delete" }}
                  size={16}
                  color={colors.destructive}
                />
                <Text style={[styles.deleteText, { color: colors.destructive }]}>
                  Delete Task
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

type SectionIcon = {
  ios: string;
  android: string;
  web: string;
};

function SectionCard({
  icon,
  title,
  colors,
  children,
}: {
  icon: string;
  title: string;
  colors: ThemeColors;
  children: ReactNode;
}) {
  const iconName: SectionIcon = {
    ios:
      icon === "description"
        ? "doc.text"
        : icon === "list_alt"
          ? "list.bullet"
          : "clock.arrow.circlepath",
    android: icon,
    web: icon,
  };

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.muted }]}>
          <AppIcon name={iconName} size={16} color={colors.accent} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueColor,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  colors: ThemeColors;
}) {
  const iconName = {
    ios:
      icon === "calendar_today"
        ? "calendar"
        : icon === "schedule"
          ? "clock"
          : icon === "folder"
            ? "folder"
            : "flag",
    android: icon,
    web: icon,
  };

  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <View style={styles.detailLeft}>
        <AppIcon name={iconName} size={15} color={colors.mutedForeground} />
        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.detailValue,
          { color: valueColor ?? colors.foreground },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function ActivityRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.activityRow}>
      <Text style={[styles.activityLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.activityValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function capitalize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function getPriorityTextColor(priority: Task["priority"], colors: ThemeColors): string {
  if (priority === "HIGH") return colors.destructive;
  if (priority === "MEDIUM") return "#F59E0B";
  return colors.accent;
}

function getPriorityBackground(priority: Task["priority"], colors: ThemeColors): string {
  if (priority === "HIGH") return colors.destructive + "18";
  if (priority === "MEDIUM") return "#F59E0B18";
  return colors.accent + "18";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 12,
  },
  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  topIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },
  summaryCard: {
    minHeight: 104,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryMain: {
    flex: 1,
    minWidth: 0,
    paddingRight: 14,
    gap: 10,
  },
  title: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "800",
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priorityBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  priorityText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  statusBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    paddingLeft: 46,
  },
  detailRow: {
    minHeight: 38,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  detailValue: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "right",
  },
  activityRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  activityLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  activityValue: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "right",
    fontWeight: "600",
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  deleteButton: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  deleteText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  pressed: { opacity: 0.75 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  stateText: { fontSize: typography.sm },
  stateTitle: { fontSize: typography.xl, fontWeight: "700" },
  link: { fontSize: typography.sm, fontWeight: "600" },
});
