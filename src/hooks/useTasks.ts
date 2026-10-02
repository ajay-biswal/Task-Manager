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
      setError(null);

      const result = await getTasks(database);
      setTasks(result);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setError("Failed to load tasks.");
    }
  }, [database]);

  useEffect(() => {
    async function initialize() {
      setLoading(true);

      try {
        await loadTasks();
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [loadTasks]);

  const addTask = useCallback(
    async (task: Task) => {
      await createTask(database, task);

      setTasks((current) => {
        const exists = current.some((item) => item.id === task.id);

        if (exists) {
          return current.map((item) => (item.id === task.id ? task : item));
        }

        return [...current, task];
      });
    },
    [database],
  );

  const editTask = useCallback(
    async (task: Task) => {
      await updateTask(database, task);

      setTasks((current) =>
        current.map((item) => (item.id === task.id ? task : item)),
      );
    },
    [database],
  );

  const removeTask = useCallback(
    async (id: string) => {
      await deleteTask(database, id);

      setTasks((current) => current.filter((item) => item.id !== id));
    },
    [database],
  );

  const toggleTask = useCallback(
    async (id: string, status: TaskStatus) => {
      await updateTaskStatus(database, id, status);

      setTasks((current) =>
        current.map((task) =>
          task.id === id
            ? {
                ...task,
                status,
                updatedAt: new Date().toISOString(),
              }
            : task,
        ),
      );
    },
    [database],
  );

  const clearTasks = useCallback(async () => {
    await deleteAllTasks(database);
    setTasks([]);
  }, [database]);

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
