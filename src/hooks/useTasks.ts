import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const pendingTaskIdsRef = useRef(new Set<string>());
  const refreshRequestRef = useRef(0);

  const loadTasks = useCallback(async () => {
    const requestId = ++refreshRequestRef.current;

    try {
      setError(null);

      const result = await getTasks(database);

      if (requestId === refreshRequestRef.current) {
        setTasks(result);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);

      if (requestId === refreshRequestRef.current) {
        setError("Failed to load tasks.");
      }
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
      if (pendingTaskIdsRef.current.has(id)) return;

      setError(null);
      pendingTaskIdsRef.current.add(id);
      setPendingTaskIds(new Set(pendingTaskIdsRef.current));

      try {
        await deleteTask(database, id);
        setTasks((current) => current.filter((item) => item.id !== id));
      } finally {
        pendingTaskIdsRef.current.delete(id);
        setPendingTaskIds(new Set(pendingTaskIdsRef.current));
      }
    },
    [database],
  );

  const toggleTask = useCallback(
    async (id: string, status: TaskStatus) => {
      if (pendingTaskIdsRef.current.has(id)) return;

      setError(null);
      pendingTaskIdsRef.current.add(id);
      setPendingTaskIds(new Set(pendingTaskIdsRef.current));

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
        pendingTaskIdsRef.current.delete(id);
        setPendingTaskIds(new Set(pendingTaskIdsRef.current));
      }
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

  const isTaskPending = useCallback(
    (id: string) => pendingTaskIds.has(id),
    [pendingTaskIds],
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
    isTaskPending,
  };
}
