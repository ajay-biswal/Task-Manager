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
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(
    () => new Set(),
  );

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
      setError(null);

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
      setError(null);

      await updateTask(database, task);

      setTasks((current) =>
        current.map((item) => (item.id === task.id ? task : item)),
      );
    },
    [database],
  );

  const removeTask = useCallback(
    async (id: string) => {
      setError(null);
      setPendingTaskIds((current) => new Set(current).add(id));

      try {
        await deleteTask(database, id);
      } finally {
        setPendingTaskIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }

      setTasks((current) => current.filter((item) => item.id !== id));
    },
    [database],
  );

  const toggleTask = useCallback(
    async (id: string, status: TaskStatus) => {
      if (pendingTaskIds.has(id)) return;

      setError(null);
      setPendingTaskIds((current) => new Set(current).add(id));

      try {
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
      } finally {
        setPendingTaskIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }
    },
    [database, pendingTaskIds],
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
    isTaskPending: (id: string) => pendingTaskIds.has(id),
  };
}
