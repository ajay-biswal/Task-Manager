import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";

import {
    createTask,
    deleteAllTasks,
    deleteTask,
    getTaskById,
    getTasks,
    updateTask,
    updateTaskStatus,
} from "@/database/taskRepository";

import type { Task, TaskStatus } from "@/types/task";

export function useTasks() {
  const database = useSQLiteContext();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getTasks(database);
      setTasks(result);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [database]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(
    async (task: Task) => {
      await createTask(database, task);
      await loadTasks();
    },
    [database, loadTasks],
  );

  const editTask = useCallback(
    async (task: Task) => {
      await updateTask(database, task);
      await loadTasks();
    },
    [database, loadTasks],
  );

  const removeTask = useCallback(
    async (id: string) => {
      await deleteTask(database, id);
      await loadTasks();
    },
    [database, loadTasks],
  );

  const toggleTask = useCallback(
    async (id: string, status: TaskStatus) => {
      await updateTaskStatus(database, id, status);
      await loadTasks();
    },
    [database, loadTasks],
  );

  const clearTasks = useCallback(async () => {
    await deleteAllTasks(database);
    await loadTasks();
  }, [database, loadTasks]);

  const findTask = useCallback(
    async (id: string) => {
      return getTaskById(database, id);
    },
    [database],
  );

  return {
    tasks,
    loading,
    error,
    addTask,
    editTask,
    removeTask,
    toggleTask,
    clearTasks,
    findTask,
    refreshTasks: loadTasks,
  };
}
