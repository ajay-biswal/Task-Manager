import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/ui/AppIcon";
import { useTasks } from "@/hooks/useTasks";
import type { ThemeColors } from "@/theme";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { TaskFormData, TaskPriority, TaskStatus } from "@/types/task";
import { createTaskFromForm } from "@/utils/taskUtils";
import { type TaskValidationErrors, validateTask } from "@/utils/validation";

const categoryOptions = ["Work", "Personal", "Study", "Health", "Other"];
const statusOptions: TaskStatus[] = ["PENDING", "COMPLETED"];
const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

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
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
  if (!value) {
    return "Select date";
  }

  return parseDate(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function FieldLabel({
  children,
  colors,
}: {
  children: string;
  colors: ThemeColors;
}) {
  return <Text style={[styles.label, { color: colors.foreground }]}>{children}</Text>;
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
  const [selectField, setSelectField] = useState<"category" | "status" | null>(null);

  const isEditMode = Boolean(taskId);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    const id = taskId;
    let active = true;

    async function loadTask() {
      try {
        const task = await findTask(id);

        if (!active) {
          return;
        }

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

        if (active) {
          router.back();
        }
      } finally {
        if (active) {
          setLoadingTask(false);
        }
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

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

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
        <ActivityIndicator size="large" color={colors.foreground} />
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
          { paddingTop: insets.top + spacing.sm },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Close task form"
          >
            <AppIcon
              name={{ ios: "xmark", android: "close", web: "close" }}
              size={21}
              color={colors.foreground}
            />
          </Pressable>

          <Text style={[styles.screenTitle, { color: colors.foreground }]}>
            {isEditMode ? "Edit Task" : "New Task"}
          </Text>

          <View style={styles.iconButton} />
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <FieldLabel colors={colors}>Title</FieldLabel>
            <TextInput
              accessibilityLabel="Task title"
              returnKeyType="next"
              maxLength={120}
              value={form.title}
              onChangeText={(value) => updateField("title", value)}
              placeholder="What needs to be done?"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: errors.title ? colors.destructive : colors.border,
                },
              ]}
            />
            {errors.title ? (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {errors.title}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel colors={colors}>Description</FieldLabel>
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
              style={[
                styles.input,
                styles.descriptionInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel colors={colors}>Category</FieldLabel>
            <SelectField
              value={form.category}
              placeholder="Select category"
              colors={colors}
              onPress={() => setSelectField("category")}
            />
            {errors.category ? (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {errors.category}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel colors={colors}>Priority</FieldLabel>
            <View style={styles.priorityRow}>
              {priorities.map((priority) => {
                const selected = form.priority === priority;

                return (
                  <Pressable
                    key={priority}
                    onPress={() => updateField("priority", priority)}
                    accessibilityRole="radio"
                    accessibilityLabel={priority.charAt(0) + priority.slice(1).toLowerCase() + " priority"}
                    accessibilityState={{ selected }}
                    style={[
                      styles.priorityButton,
                      {
                        backgroundColor: selected ? colors.accent : colors.muted,
                        borderColor: selected ? colors.accent : colors.muted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        {
                          color: selected ? "#FFFFFF" : colors.foreground,
                        },
                      ]}
                    >
                      {priority.charAt(0) + priority.slice(1).toLowerCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.priority ? (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {errors.priority}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel colors={colors}>Schedule</FieldLabel>

            <View style={styles.dateRow}>
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

          <View style={styles.fieldGroup}>
            <FieldLabel colors={colors}>Status</FieldLabel>
            <SelectField
              value={form.status === "PENDING" ? "Pending" : "Completed"}
              colors={colors}
              onPress={() => setSelectField("status")}
            />
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => router.back()}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={({ pressed }) => [
                styles.cancelButton,
                { backgroundColor: colors.muted, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.cancelText, { color: colors.foreground }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={isEditMode ? "Update task" : "Create task"}
              style={({ pressed }) => [
                styles.createButton,
                { backgroundColor: colors.accent },
                pressed && styles.pressed,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.createText}>
                  {isEditMode ? "Update Task" : "Create Task"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={selectField !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectField(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modal,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {selectField === "category" ? "Category" : "Status"}
              </Text>
              <Pressable
                onPress={() => setSelectField(null)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={selectField === "category" ? "Close category selector" : "Close status selector"}
              >
                <AppIcon
                  name={{ ios: "xmark", android: "close", web: "close" }}
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>

            {(selectField === "category"
              ? Array.from(
                  new Set([
                    ...categoryOptions,
                    ...(form.category ? [form.category] : []),
                  ]),
                )
              : statusOptions
            ).map((option) => {
                const display =
                  option === "PENDING"
                    ? "Pending"
                    : option === "COMPLETED"
                      ? "Completed"
                      : option;

                const current =
                  selectField === "category"
                    ? form.category === option
                    : form.status === option;

                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      if (selectField === "category") {
                        updateField("category", option);
                      } else {
                        updateField("status", option as TaskStatus);
                      }
                      setSelectField(null);
                    }}
                    accessibilityRole="radio"
                    accessibilityLabel={display}
                    accessibilityState={{ selected: current }}
                    style={[
                      styles.modalOption,
                      current && { backgroundColor: colors.muted },
                    ]}
                  >
                    <Text style={[styles.modalOptionText, { color: colors.foreground }]}>
                      {display}
                    </Text>
                    {current ? (
                      <AppIcon
                        name={{ ios: "checkmark", android: "check", web: "check" }}
                        size={18}
                        color={colors.accent}
                      />
                    ) : null}
                  </Pressable>
                );
              },
            )}
          </View>
        </View>
      </Modal>

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

function SelectField({
  value,
  placeholder,
  colors,
  onPress,
}: {
  value: string;
  placeholder?: string;
  colors: ThemeColors;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value || placeholder || "Select option"}
      style={[
        styles.selectField,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.selectText,
          { color: value ? colors.foreground : colors.mutedForeground },
        ]}
      >
        {value || placeholder}
      </Text>
      <AppIcon
        name={{ ios: "chevron.down", android: "keyboard_arrow_down", web: "keyboard_arrow_down" }}
        size={18}
        color={colors.mutedForeground}
      />
    </Pressable>
  );
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
        accessibilityLabel={label + ", " + (value ? formatDate(value) : "Select date")}
        style={[
          styles.dateField,
          { backgroundColor: colors.card, borderColor: error ? colors.destructive : colors.border },
        ]}
      >
        <AppIcon
          name={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
          size={15}
          color={colors.mutedForeground}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.dateText,
            { color: value ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {formatDate(value)}
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  container: {
    flex: 1,
  },

  topBar: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  screenTitle: {
    fontSize: typography.md,
    fontWeight: "700",
  },

  form: {
    gap: spacing.md,
  },

  fieldGroup: {
    gap: spacing.xs,
  },

  label: {
    fontSize: typography.xs,
    fontWeight: "600",
  },

  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: typography.xs,
  },

  descriptionInput: {
    minHeight: 82,
    paddingTop: spacing.sm,
  },

  selectField: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectText: {
    fontSize: typography.xs,
  },

  priorityRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },

  priorityButton: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  priorityText: {
    fontSize: typography.xs,
    fontWeight: "600",
  },

  dateRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  dateFieldContainer: {
    flex: 1,
    gap: spacing.xs,
  },

  dateLabel: {
    fontSize: 10,
  },

  dateField: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  dateText: {
    flex: 1,
    fontSize: 10,
  },

  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },

  cancelButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  createButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    fontSize: typography.xs,
    fontWeight: "600",
  },

  createText: {
    fontSize: typography.xs,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  error: {
    fontSize: 10,
  },

  pressed: {
    opacity: 0.75,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    fontSize: typography.sm,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modal: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  modalTitle: {
    fontSize: typography.md,
    fontWeight: "700",
  },

  modalOption: {
    minHeight: 46,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalOptionText: {
    fontSize: typography.sm,
  },
});
