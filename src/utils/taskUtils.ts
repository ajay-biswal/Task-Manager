import { randomUUID } from "expo-crypto";

import type { Task, TaskFormData } from "@/types/task";

export function createTaskFromForm(data: TaskFormData): Task {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
}

export function isTaskOverdue(task: Task): boolean {
  if (task.status !== "PENDING") {
    return false;
  }

  const today = new Date();
  const dueDate = new Date(`${task.dueDate}T00:00:00`);

  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}
