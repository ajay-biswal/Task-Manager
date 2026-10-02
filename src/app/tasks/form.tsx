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
  return (
    <Text style={{ fontSize: typography.xs, fontWeight: "600", color: colors.foreground }}>
      {children}
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
  
const styles = StyleSheet.create({
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    container: { flex: 1 },
    topBar: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    screenTitle: { fontSize: typography.md, fontWeight: "700" },
    form: { gap: spacing.md },
    fieldGroup: { gap: spacing.xs },
    label: { fontSize: typography.xs, fontWeight: "600" },
    input: {
      minHeight: 44, borderWidth: 1, borderRadius: 8,
      paddingHorizontal: spacing.md, fontSize: typography.xs,
    },
    descriptionInput: { minHeight: 82, paddingTop: spacing.sm },
    selectField: {
      minHeight: 44, borderWidth: 1, borderRadius: 8,
      paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center",
      justifyContent: "space-between",
    },
    selectText: { fontSize: typography.xs },
    priorityRow: { flexDirection: "row", gap: spacing.xs },
    priorityButton: {
      flex: 1, minHeight: 40, borderWidth: 1, borderRadius: 7,
      alignItems: "center", justifyContent: "center",
    },
    priorityText: { fontSize: typography.xs, fontWeight: "600" },
    dateRow: { flexDirection: "row", gap: spacing.sm },
    dateFieldContainer: { flex: 1, gap: spacing.xs },
    dateLabel: { fontSize: 10 },
    dateField: {
      minHeight: 44, borderWidth: 1, borderRadius: 8,
      paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center",
      gap: spacing.xs,
    },
    dateText: { flex: 1, fontSize: 10 },
    actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
    cancelButton: {
      flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 8,
      alignItems: "center", justifyContent: "center",
    },
    createButton: {
      flex: 1, minHeight: 44, borderRadius: 8,
      alignItems: "center", justifyContent: "center",
    },
    cancelText: { fontSize: typography.xs, fontWeight: "600" },
    createText: { fontSize: typography.xs, fontWeight: "700", color: "#FFFFFF" },
    error: { fontSize: 10 },
    pressed: { opacity: 0.75 },
    loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
    loadingText: { fontSize: typography.sm },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    modal: {
      borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1,
      padding: spacing.lg, paddingBottom: spacing.xxl,
    },
    modalHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    modalTitle: { fontSize: typography.md, fontWeight: "700" },
    modalOption: {
      minHeight: 46, borderRadius: 8, paddingHorizontal: spacing.md,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    modalOptionText: { fontSize: typography.sm },
});
