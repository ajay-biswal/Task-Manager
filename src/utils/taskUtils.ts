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
