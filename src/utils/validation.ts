import type { TaskPriority } from "@/types/task";

interface TaskFormData {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
}

export interface TaskValidationErrors {
  title?: string;
  category?: string;
  priority?: string;
  startDate?: string;
  dueDate?: string;
}

export function validateTask(data: TaskFormData): TaskValidationErrors {
  const errors: TaskValidationErrors = {};

  if (!data.title.trim()) {
    errors.title = "Title is required";
  }

  if (!data.category.trim()) {
    errors.category = "Category is required";
  }

  if (!data.priority) {
    errors.priority = "Priority is required";
  }

  if (!data.startDate) {
    errors.startDate = "Start date is required";
  }

  if (!data.dueDate) {
    errors.dueDate = "Due date is required";
  }

  if (
    data.startDate &&
    data.dueDate &&
    new Date(data.dueDate) < new Date(data.startDate)
  ) {
    errors.dueDate = "Due date cannot be earlier than start date";
  }

  return errors;
}
