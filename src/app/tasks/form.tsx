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
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.labelRow}>
              <FieldLabel colors={colors}>Title</FieldLabel>
              <Text style={[styles.counter, { color: colors.mutedForeground }]}>{form.title.length}/100</Text>
            </View>
            <View style={[styles.inputShell, { backgroundColor: colors.card, borderColor: errors.title ? colors.destructive : colors.border }]}>
              <AppIcon name={{ ios: "doc.text", android: "description", web: "description" }} size={20} color={colors.mutedForeground} />
              <TextInput
              accessibilityLabel="Task title"
              returnKeyType="next"
              maxLength={120}
              value={form.title}
              onChangeText={(value) => updateField("title", value)}
              placeholder="What needs to be done?"
              placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, backgroundColor: "transparent", borderWidth: 0, flex: 1 }]}
              />
            </View>
            {errors.title ? (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {errors.title}
              </Text>
            ) : null}
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.labelRow}>
              <FieldLabel colors={colors}>Description</FieldLabel>
              <Text style={[styles.counter, { color: colors.mutedForeground }]}>{form.description.length}/500</Text>
            </View>
            <View style={[styles.inputShell, styles.descriptionShell, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <AppIcon name={{ ios: "text.alignleft", android: "format_align_left", web: "format_align_left" }} size={20} color={colors.mutedForeground} />
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
                style={[styles.input, styles.descriptionInput, { color: colors.foreground, backgroundColor: "transparent", borderWidth: 0, flex: 1 }]}
              />
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FieldLabel colors={colors}>Category</FieldLabel>
            <View style={styles.optionRow}>
              {[
                { label: "Work", icon: { ios: "briefcase.fill", android: "business_center", web: "business_center" } },
                { label: "Personal", icon: { ios: "house.fill", android: "home", web: "home" } },
                { label: "Study", icon: { ios: "graduationcap.fill", android: "school", web: "school" } },
                { label: "Health", icon: { ios: "heart.fill", android: "favorite", web: "favorite" } },
                { label: "Other", icon: { ios: "ellipsis", android: "more_horiz", web: "more_horiz" } },
              ].map((item) => {
                const selected = form.category === item.label;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => updateField("category", item.label)}
                    accessibilityRole="radio"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected }}
                    style={[styles.categoryOption, { backgroundColor: selected ? colors.accent + "16" : colors.muted, borderColor: selected ? colors.accent : colors.border }]}
                  >
                    <AppIcon name={item.icon} size={20} color={selected ? colors.accent : colors.mutedForeground} />
                    <Text style={[styles.optionText, { color: colors.foreground }]}>{item.label}</Text>
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

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                        backgroundColor: selected ? priorityColor(priority) + "18" : colors.muted,
                        borderColor: selected ? priorityColor(priority) : colors.border,
                      },
                    ]}
                  >
                    <AppIcon
                      name={priority === "LOW"
                        ? { ios: "arrow.down", android: "arrow_downward", web: "arrow_downward" }
                        : priority === "MEDIUM"
                          ? { ios: "equal", android: "drag_handle", web: "drag_handle" }
                          : { ios: "arrow.up", android: "arrow_upward", web: "arrow_upward" }}
                      size={20}
                      color={priorityColor(priority)}
                    />
                    <Text style={[styles.priorityText, { color: colors.foreground }]}>
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

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
            <Pressable
              disabled
              style={[styles.scheduleRow, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <AppIcon name={{ ios: "repeat", android: "sync", web: "sync" }} size={20} color={colors.mutedForeground} />
              <Text style={[styles.scheduleTitle, { color: colors.foreground }]}>Repeat</Text>
              <Text style={[styles.scheduleValue, { color: colors.mutedForeground }]}>Does not repeat</Text>
              <AppIcon name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FieldLabel colors={colors}>Status</FieldLabel>
            <SelectField
              value={form.status === "PENDING" ? "Pending" : "Completed"}
              colors={colors}
              onPress={() => setSelectField("status")}
            />
          </View>

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
              <>
                <AppIcon
                  name={{ ios: "checkmark", android: "check", web: "check" }}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.createText}>
                  {isEditMode ? "Update Task" : "Create Task"}
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
              onPress={() => router.push("/bulk-upload")}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Bulk upload tasks"
              style={({ pressed }) => [
                styles.bulkButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
            >
              <AppIcon
                name={{ ios: "square.and.arrow.down", android: "upload_file", web: "upload_file" }}
                size={19}
                color={colors.accent}
              />
              <Text style={[styles.bulkText, { color: colors.accent }]}>Bulk Upload</Text>
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

function priorityColor(priority: TaskPriority): string {
  if (priority === "LOW") return "#22C55E";
  if (priority === "MEDIUM") return "#EAB308";
  return "#EF4444";
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

  sectionCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  counter: {
    fontSize: 10,
  },

  label: {
    fontSize: typography.xs,
    fontWeight: "600",
  },

  inputShell: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  descriptionShell: {
    alignItems: "flex-start",
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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
    minHeight: 74,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  optionRow: {
    flexDirection: "row",
    gap: 6,
  },

  categoryOption: {
    flex: 1,
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 2,
  },

  optionText: {
    fontSize: 9,
    fontWeight: "600",
  },

  scheduleRow: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  scheduleTitle: {
    fontSize: typography.xs,
    fontWeight: "600",
  },

  scheduleValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 10,
  },

  bulkButton: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },

  bulkText: {
    fontSize: typography.xs,
    fontWeight: "700",
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
