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

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { AppSelect } from "@/components/ui/AppSelect";
import { DateField } from "@/components/ui/DateField";
import { PrioritySelector } from "@/components/ui/PrioritySelector";
import { useTasks } from "@/hooks/useTasks";
import { colors, spacing, typography } from "@/theme";
import type { TaskFormData, TaskStatus } from "@/types/task";
import { createTaskFromForm } from "@/utils/taskUtils";
import { type TaskValidationErrors, validateTask } from "@/utils/validation";

const categoryOptions = ["Work", "Personal", "Study", "Health", "Other"];

const statusOptions: TaskStatus[] = ["PENDING", "COMPLETED"];

const initialForm: TaskFormData = {
  title: "",
  description: "",
  category: "",
  priority: "MEDIUM",
  startDate: "",
  dueDate: "",
  status: "PENDING",
};

export default function TaskFormScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string;
  }>();

  const taskId = typeof params.id === "string" ? params.id : undefined;

  const { addTask, editTask, findTask } = useTasks();

  const [form, setForm] = useState<TaskFormData>(initialForm);

  const [errors, setErrors] = useState<TaskValidationErrors>({});

  const [loadingTask, setLoadingTask] = useState(Boolean(taskId));

  const [saving, setSaving] = useState(false);

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
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
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
          return;
        }

        await editTask({
          ...existingTask,
          ...form,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const newTask = createTaskFromForm(form);

        await addTask(newTask);
      }

      router.back();
    } catch (error) {
      console.error("Failed to save task:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loadingTask) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.light.foreground} />
        <Text style={styles.loadingText}>Loading task...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditMode ? "Edit Task" : "Create Task"}
          </Text>

          <Text style={styles.subtitle}>
            {isEditMode
              ? "Update the task details."
              : "Add a new task to your workspace."}
          </Text>
        </View>

        <View style={styles.form}>
          <AppInput
            label="Title"
            placeholder="Enter task title"
            value={form.title}
            error={errors.title}
            onChangeText={(value) => updateField("title", value)}
          />

          <AppInput
            label="Description"
            placeholder="Add a description"
            value={form.description}
            multiline
            textAlignVertical="top"
            onChangeText={(value) => updateField("description", value)}
            style={styles.descriptionInput}
          />

          <AppSelect
            label="Category"
            value={form.category}
            options={categoryOptions}
            placeholder="Select category"
            error={errors.category}
            onChange={(value) => updateField("category", value)}
          />

          <PrioritySelector
            value={form.priority}
            onChange={(value) => updateField("priority", value)}
          />

          {errors.priority ? (
            <Text style={styles.error}>{errors.priority}</Text>
          ) : null}

          <DateField
            label="Start date"
            value={form.startDate}
            error={errors.startDate}
            onChange={(value) => updateField("startDate", value)}
          />

          <DateField
            label="Due date"
            value={form.dueDate}
            error={errors.dueDate}
            minimumDate={
              form.startDate
                ? new Date(`${form.startDate}T00:00:00`)
                : undefined
            }
            onChange={(value) => updateField("dueDate", value)}
          />

          <AppSelect
            label="Status"
            value={form.status}
            options={statusOptions}
            onChange={(value) => updateField("status", value as TaskStatus)}
          />

          <View style={styles.actions}>
            <AppButton
              title="Cancel"
              variant="secondary"
              onPress={() => router.back()}
              disabled={saving}
            />

            <AppButton
              title={isEditMode ? "Update Task" : "Create Task"}
              onPress={handleSave}
              loading={saving}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },

  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  header: {
    marginBottom: spacing.xxl,
    gap: spacing.xs,
  },

  title: {
    fontSize: typography.xxxl,
    fontWeight: "700",
    color: colors.light.foreground,
  },

  subtitle: {
    fontSize: typography.md,
    color: colors.light.mutedForeground,
  },

  form: {
    gap: spacing.lg,
  },

  descriptionInput: {
    minHeight: 110,
    paddingTop: spacing.md,
  },

  error: {
    marginTop: -spacing.md,
    fontSize: typography.xs,
    color: colors.light.destructive,
  },

  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.light.background,
  },

  loadingText: {
    fontSize: typography.md,
    color: colors.light.mutedForeground,
  },
});
