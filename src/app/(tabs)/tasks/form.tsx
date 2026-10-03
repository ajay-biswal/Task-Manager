import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/ui/AppIcon";
import {
  Button,
  DateField,
  Dialog,
  IconButton,
  Input,
  ScreenHeader,
  type DialogAction,
} from "@/components/ui";
import {
  TaskCategorySelector,
  TaskPrioritySelector,
  TaskStatusSelector,
} from "@/components/task";
import { useTasks } from "@/hooks/useTasks";
import { useTaskFormDraft } from "@/context/TaskFormDraftContext";
import type { ThemeColors } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { TaskFormData } from "@/types/task";
import { createTaskFromForm } from "@/utils/taskUtils";
import { type TaskValidationErrors, validateTask } from "@/utils/validation";


const initialForm: TaskFormData = {
  title: "",
  description: "",
  category: "",
  priority: "MEDIUM",
  startDate: "",
  dueDate: "",
  status: "PENDING",
};

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
  const params = useLocalSearchParams<{ id?: string; returnTo?: string }>();
  const taskId = typeof params.id === "string" ? params.id : undefined;
  const returnTo = typeof params.returnTo === "string" ? params.returnTo : undefined;

  const { addTask, editTask, findTask } = useTasks();
  const { draft, setDraft, clearDraft } = useTaskFormDraft();
  const { colors } = useTheme();

  const [form, setForm] = useState<TaskFormData>(taskId ? initialForm : draft);
  const [errors, setErrors] = useState<TaskValidationErrors>({});
  const [loadingTask, setLoadingTask] = useState(Boolean(taskId));
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    actions?: DialogAction[];
  } | null>(null);

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

  useEffect(() => {
    if (isEditMode) return;

    setDraft(form);
  }, [form, isEditMode, setDraft]);

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
          setDialog({
            title: "Task not found",
            message: "This task no longer exists.",
          });
          return;
        }

        await editTask({
          ...existingTask,
          ...form,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addTask(createTaskFromForm(form));
        clearDraft();
        setForm(initialForm);
        setErrors({});
      }

      router.back();
    } catch (error) {
      console.error("Failed to save task:", error);
      setDialog({
        title: "Save failed",
        message: "Unable to save the task. Please try again.",
      });
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
        <ScreenHeader
          title={isEditMode ? "Edit Task" : "New Task"}
          subtitle="Add a task and keep things on track."
          left={
            <IconButton
              icon={
                <AppIcon
                  name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
                  size={22}
                  color={colors.foreground}
                />
              }
              onPress={() => {
                if (!isEditMode && returnTo === "dashboard") {
                  router.replace("/");
                  return;
                }

                router.back();
              }}
              accessibilityLabel="Go back"
              variant="ghost"
              size="md"
              disabled={saving}
            />
          }
          right={
            <IconButton
              icon={
                <AppIcon
                  name={{
                    ios: "square.and.arrow.down",
                    android: "upload_file",
                    web: "upload_file",
                  }}
                  size={20}
                  color={colors.accent}
                />
              }
              onPress={() => router.push("/bulk-upload")}
              accessibilityLabel="Bulk upload tasks"
              variant="ghost"
              size="md"
              disabled={saving}
            />
          }
        />

        <View style={styles.form}>
          <View
            style={[
              styles.fieldCard,
            ]}
          >
            <View style={styles.labelRow}>
              <FieldLabel colors={colors} required>
                Title
              </FieldLabel>
              <Text style={[styles.counter, { color: colors.mutedForeground }]}>
                {form.title.length}/100
              </Text>
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

          <View
            style={[
              styles.section,
            ]}
          >
            <FieldLabel colors={colors} required>Category</FieldLabel>
            <TaskCategorySelector
              value={form.category}
              onChange={(value) => updateField("category", value)}
              error={errors.category}
            />
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <FieldLabel colors={colors} required>Priority</FieldLabel>
            <TaskPrioritySelector
              value={form.priority}
              onChange={(value) => updateField("priority", value)}
            />
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <FieldLabel colors={colors} required>Schedule</FieldLabel>
            <View style={styles.scheduleTopRow}>
              <DateField
                label="Start date"
                required
                value={form.startDate}
                onChange={(value) => updateField("startDate", value)}
                error={errors.startDate}
              />
              <DateField
                label="Due date"
                required
                value={form.dueDate}
                onChange={(value) => updateField("dueDate", value)}
                error={errors.dueDate}
                minimumDate={
                  form.startDate
                    ? (() => {
                        const [year, month, day] = form.startDate
                          .split("-")
                          .map(Number);
                        return new Date(year, month - 1, day);
                      })()
                    : undefined
                }
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
            <TaskStatusSelector
              value={form.status}
              onChange={(value) => updateField("status", value)}
            />
          </View>

          <View style={styles.actions}>
            <Button
              title={isEditMode ? "Update Task" : "Create Task"}
              onPress={handleSave}
              loading={saving}
              disabled={saving}
            />

            {!isEditMode ? (
              <Button
                title="Clear"
                onPress={() => {
                  setDialog({
                    title: "Clear form",
                    message: "Clear all entered task details?",
                    actions: [
                      {
                        label: "Cancel",
                        variant: "cancel",
                        onPress: () => setDialog(null),
                      },
                      {
                        label: "Clear",
                        variant: "danger",
                        onPress: () => {
                          clearDraft();
                          setForm(initialForm);
                          setErrors({});
                          setDialog(null);
                        },
                      },
                    ],
                  });
                }}
                variant="secondary"
                disabled={saving}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>


      <Dialog
        visible={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message}
        actions={
          dialog?.actions ?? [
            {
              label: "OK",
              onPress: () => setDialog(null),
            },
          ]
        }
        onRequestClose={() => setDialog(null)}
      />
    </KeyboardAvoidingView>
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

  form: {
    gap: 12,
  },

  actions: {
    gap: 10,
    marginTop: 4,
  },

  fieldCard: {
    paddingVertical: 4,
    gap: 9,
  },

  section: {
    paddingVertical: 4,
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

























  scheduleTopRow: {
    flexDirection: "row",
    gap: 9,
  },





















  error: {
    fontSize: 11,
    lineHeight: 15,
  },

  pressed: {
    opacity: 0.72,
  },

});
