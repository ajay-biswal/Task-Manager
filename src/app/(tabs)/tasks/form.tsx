import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/ui/AppIcon";
import { Button, Input } from "@/components/ui";
import { useTasks } from "@/hooks/useTasks";
import type { ThemeColors } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { TaskFormData, TaskPriority, TaskStatus } from "@/types/task";
import { formatDate } from "@/utils/dateUtils";
import { createTaskFromForm } from "@/utils/taskUtils";
import { type TaskValidationErrors, validateTask } from "@/utils/validation";

const categoryOptions = ["Work", "Personal", "Study", "Health", "Other"];
const statusOptions: TaskStatus[] = ["PENDING", "COMPLETED"];
const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

const categoryIcons = {
  Work: { ios: "briefcase.fill", android: "business_center", web: "business_center" },
  Personal: { ios: "house.fill", android: "home", web: "home" },
  Study: { ios: "graduationcap.fill", android: "school", web: "school" },
  Health: { ios: "heart.fill", android: "favorite", web: "favorite" },
  Other: { ios: "ellipsis", android: "more_horiz", web: "more_horiz" },
} as const;

const initialForm: TaskFormData = {
  title: "",
  description: "",
  category: "",
  priority: "MEDIUM",
  startDate: "",
  dueDate: "",
  status: "PENDING",
};

function parseDate(value: string): Date {
  if (!value) return new Date();

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function FieldLabel({
  children,
  colors,
  required = false,
}: {
  children: string;
  colors: ThemeColors;
  required?: boolean;
}) {
  return (
    <Text style={[styles.label, { color: colors.foreground }]}>
      {children}
      {required ? <Text style={{ color: colors.destructive }}> *</Text> : null}
    </Text>
  );
}

export default function TaskFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const taskId = typeof params.id === "string" ? params.id : undefined;

  const { addTask, editTask, findTask } = useTasks();
  const { colors } = useTheme();

  const [form, setForm] = useState<TaskFormData>(initialForm);
  const [errors, setErrors] = useState<TaskValidationErrors>({});
  const [loadingTask, setLoadingTask] = useState(Boolean(taskId));
  const [saving, setSaving] = useState(false);
  const [dateField, setDateField] = useState<"startDate" | "dueDate" | null>(null);

  const isEditMode = Boolean(taskId);

  useEffect(() => {
    if (!taskId) return;

    const id = taskId;
    let active = true;

    async function loadTask() {
      try {
        const task = await findTask(id);

        if (!active) return;

        if (!task) {
          router.back();
          return;
        }

        setForm({
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          startDate: task.startDate,
          dueDate: task.dueDate,
          status: task.status,
        });
      } catch (error) {
        console.error("Failed to load task:", error);
        if (active) router.back();
      } finally {
        if (active) setLoadingTask(false);
      }
    }

    loadTask();

    return () => {
      active = false;
    };
  }, [taskId, findTask, router]);

  function updateField<K extends keyof TaskFormData>(
    field: K,
    value: TaskFormData[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSave() {
    const validationErrors = validateTask(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setSaving(true);

      if (isEditMode && taskId) {
        const existingTask = await findTask(taskId);

        if (!existingTask) {
          Alert.alert("Task not found", "This task no longer exists.");
          return;
        }

        await editTask({
          ...existingTask,
          ...form,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addTask(createTaskFromForm(form));
      }

      router.back();
    } catch (error) {
      console.error("Failed to save task:", error);
      Alert.alert("Save failed", "Unable to save the task. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingTask) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading task...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={[
              styles.backButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon
              name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
              size={22}
              color={colors.foreground}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {isEditMode ? "Edit Task" : "New Task"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Add a task and keep things on track.
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/bulk-upload")}
            disabled={saving}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Bulk upload tasks"
            style={({ pressed }) => [
              styles.bulkHeaderButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <AppIcon
              name={{
                ios: "square.and.arrow.down",
                android: "upload_file",
                web: "upload_file",
              }}
              size={20}
              color={colors.accent}
            />
          </Pressable>
        </View>

        <View style={styles.form}>
          <View
            style={[
              styles.fieldCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.labelRow}>
              <FieldLabel colors={colors}>Description</FieldLabel>
              <Text style={[styles.counter, { color: colors.mutedForeground }]}>
                {form.description.length}/500
              </Text>
            </View>

            <Input
              value={form.description}
              onChangeText={(value) => updateField("description", value)}
              placeholder="Add some context (optional)..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />

          </View>

            <Input
              value={form.title}
              onChangeText={(value) => updateField("title", value)}
              placeholder="What needs to be done?"
              error={errors.title}
              maxLength={100}
              returnKeyType="next"
            />

          </View>

            <View
              style={[
                styles.inputShell,
                {
                  backgroundColor: colors.background,
                  borderColor: errors.title ? colors.destructive : colors.border,
                },
              ]}
            >
              <AppIcon
                name={{ ios: "doc.text", android: "description", web: "description" }}
                size={20}
                color={colors.mutedForeground}
              />
              <TextInput
                accessibilityLabel="Task title"
                returnKeyType="next"
                maxLength={100}
                value={form.title}
                onChangeText={(value) => updateField("title", value)}
                placeholder="What needs to be done?"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>

            {errors.title ? (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {errors.title}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.fieldCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.labelRow}>
              <FieldLabel colors={colors}>Description</FieldLabel>
              <Text style={[styles.counter, { color: colors.mutedForeground }]}>
                {form.description.length}/500
              </Text>
            </View>

            <View
              style={[
                styles.descriptionShell,
                { backgroundColor: colors.input, borderColor: colors.border },
              ]}
            >
              <AppIcon
                name={{
                  ios: "text.alignleft",
                  android: "format_align_left",
                  web: "format_align_left",
                }}
                size={20}
                color={colors.mutedForeground}
              />
              <TextInput
                accessibilityLabel="Task description"
                returnKeyType="done"
                maxLength={500}
                value={form.description}
                onChangeText={(value) => updateField("description", value)}
                placeholder="Add some context (optional)..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                textAlignVertical="top"
                style={[styles.descriptionInput, { color: colors.foreground }]}
              />
            </View>
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <FieldLabel colors={colors}>Category</FieldLabel>

            <View style={styles.categoryGrid}>
              {[
                ...categoryOptions,
                ...(form.category && !categoryOptions.includes(form.category)
                  ? [form.category]
                  : []),
              ].map((category) => {
                const selected = form.category === category;
                const icon =
                  category in categoryIcons
                    ? categoryIcons[category as keyof typeof categoryIcons]
                    : categoryIcons.Other;

                return (
                  <Pressable
                    key={category}
                    onPress={() => updateField("category", category)}
                    accessibilityRole="radio"
                    accessibilityLabel={category}
                    accessibilityState={{ selected }}
                    style={[
                      styles.categoryOption,
                      {
                        backgroundColor: selected
                          ? colors.accent + "12"
                          : colors.muted,
                        borderColor: selected ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        {
                          backgroundColor: selected
                            ? colors.accent + "18"
                            : colors.background,
                        },
                      ]}
                    >
                      <AppIcon
                        name={icon}
                        size={19}
                        color={selected ? colors.accent : colors.mutedForeground}
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.categoryText,
                        { color: colors.foreground },
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {errors.category ? (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {errors.category}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <FieldLabel colors={colors}>Priority</FieldLabel>

            <View style={styles.priorityRow}>
              {priorities.map((priority) => {
                const selected = form.priority === priority;

                return (
                  <Pressable
                    key={priority}
                    onPress={() => updateField("priority", priority)}
                    accessibilityRole="radio"
                    accessibilityLabel={`${priority.toLowerCase()} priority`}
                    accessibilityState={{ selected }}
                    style={[
                      styles.priorityButton,
                      {
                        backgroundColor: selected
                          ? priorityColor(priority) + "14"
                          : colors.muted,
                        borderColor: selected
                          ? priorityColor(priority)
                          : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.priorityIcon,
                        {
                          backgroundColor: priorityColor(priority) + "14",
                        },
                      ]}
                    >
                      <AppIcon
                        name={
                          priority === "LOW"
                            ? {
                                ios: "arrow.down",
                                android: "arrow_downward",
                                web: "arrow_downward",
                              }
                            : priority === "MEDIUM"
                              ? {
                                  ios: "equal",
                                  android: "drag_handle",
                                  web: "drag_handle",
                                }
                              : {
                                  ios: "arrow.up",
                                  android: "arrow_upward",
                                  web: "arrow_upward",
                                }
                        }
                        size={18}
                        color={priorityColor(priority)}
                      />
                    </View>
                    <Text style={[styles.priorityText, { color: colors.foreground }]}>
                      {priority.charAt(0) + priority.slice(1).toLowerCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <FieldLabel colors={colors}>Schedule</FieldLabel>

            <View style={styles.scheduleTopRow}>
              <DateField
                label="Start date"
                value={form.startDate}
                colors={colors}
                onPress={() => setDateField("startDate")}
                error={errors.startDate}
              />

              <DateField
                label="Due date"
                value={form.dueDate}
                colors={colors}
                onPress={() => setDateField("dueDate")}
                error={errors.dueDate}
              />
            </View>

          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <FieldLabel colors={colors}>Status</FieldLabel>

            <View style={styles.statusRow}>
              {statusOptions.map((status) => {
                const selected = form.status === status;
                const isPending = status === "PENDING";

                return (
                  <Pressable
                    key={status}
                    onPress={() => updateField("status", status)}
                    accessibilityRole="radio"
                    accessibilityLabel={isPending ? "Pending" : "Completed"}
                    accessibilityState={{ selected }}
                    style={[
                      styles.statusOption,
                      {
                        backgroundColor: selected
                          ? colors.accent + "12"
                          : colors.muted,
                        borderColor: selected ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusIcon,
                        {
                          backgroundColor: selected
                            ? colors.accent + "18"
                            : colors.background,
                        },
                      ]}
                    >
                      <AppIcon
                        name={
                          isPending
                            ? {
                                ios: "clock",
                                android: "schedule",
                                web: "schedule",
                              }
                            : {
                                ios: "checkmark.circle.fill",
                                android: "check_circle",
                                web: "check_circle",
                              }
                        }
                        size={20}
                        color={selected ? colors.accent : colors.mutedForeground}
                      />
                    </View>
                    <Text style={[styles.statusText, { color: colors.foreground }]}>
                      {isPending ? "Pending" : "Completed"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Button
            title={isEditMode ? "Update Task" : "Create Task"}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />

        </View>
      </ScrollView>

      {dateField ? (
        <DateTimePicker
          value={parseDate(form[dateField])}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={
            dateField === "dueDate" && form.startDate
              ? parseDate(form.startDate)
              : undefined
          }
          onValueChange={(event, date) => {
            if (date) {
              updateField(dateField, toISODate(date));
              setDateField(null);
            }
          }}
          onDismiss={() => setDateField(null)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

function priorityColor(priority: TaskPriority): string {
  if (priority === "LOW") return "#22C55E";
  if (priority === "MEDIUM") return "#EAB308";
  return "#EF4444";
}

function DateField({
  label,
  value,
  colors,
  onPress,
  error,
}: {
  label: string;
  value: string;
  colors: ThemeColors;
  onPress: () => void;
  error?: string;
}) {
  return (
    <View style={styles.dateFieldContainer}>
      <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value ? formatDate(value) : "Select date"}`}
        style={[
          styles.dateField,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.destructive : colors.border,
          },
        ]}
      >
        <AppIcon
          name={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
          size={17}
          color={colors.mutedForeground}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.dateText,
            { color: value ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {value ? formatDate(value) : "Select date"}
        </Text>
      </Pressable>
      {error ? (
        <Text style={[styles.error, { color: colors.destructive }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    fontSize: 14,
  },

  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
    marginLeft: 14,
  },

  bulkHeaderButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
  },

  form: {
    gap: 12,
  },

  fieldCard: {
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    gap: 9,
  },

  section: {
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    gap: 11,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },

  counter: {
    fontSize: 11,
    fontWeight: "500",
  },

  inputShell: {
    minHeight: 55,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  input: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: "500",
  },

  descriptionShell: {
    minHeight: 105,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingTop: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  descriptionInput: {
    flex: 1,
    minHeight: 78,
    paddingTop: 1,
    paddingBottom: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  categoryOption: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 92,
    minHeight: 82,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },

  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },

  priorityRow: {
    flexDirection: "row",
    gap: 9,
  },

  priorityButton: {
    flex: 1,
    minHeight: 72,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  priorityIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  priorityText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },

  scheduleTopRow: {
    flexDirection: "row",
    gap: 9,
  },

  dateFieldContainer: {
    flex: 1,
    gap: 6,
  },

  dateLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  dateField: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  dateText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
  },

  statusRow: {
    flexDirection: "row",
    gap: 10,
  },

  statusOption: {
    flex: 1,
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 10,
  },

  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },

  primaryButton: {
    minHeight: 56,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 2,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },

  error: {
    fontSize: 11,
    lineHeight: 15,
  },

  pressed: {
    opacity: 0.72,
  },

});
