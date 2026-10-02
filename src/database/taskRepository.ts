import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import type { SQLiteDatabase } from "expo-sqlite";

type TaskRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  start_date: string;
  due_date: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

function mapRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    startDate: row.start_date,
    dueDate: row.due_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getTasks(database: SQLiteDatabase): Promise<Task[]> {
  const rows = await database.getAllAsync<TaskRow>(
    "SELECT * FROM tasks ORDER BY due_date ASC",
  );

  return rows.map(mapRowToTask);
}

export async function getTaskById(
  database: SQLiteDatabase,
  id: string,
): Promise<Task | null> {
  const row = await database.getFirstAsync<TaskRow>(
    "SELECT * FROM tasks WHERE id = ?",
    id,
  );

  return row ? mapRowToTask(row) : null;
}

export async function createTask(
  database: SQLiteDatabase,
  task: Task,
): Promise<void> {
  await database.runAsync(
    `
      INSERT INTO tasks (
        id,
        title,
        description,
        category,
        priority,
        start_date,
        due_date,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    task.id,
    task.title,
    task.description,
    task.category,
    task.priority,
    task.startDate,
    task.dueDate,
    task.status,
    task.createdAt,
    task.updatedAt,
  );
}

export async function updateTask(
  database: SQLiteDatabase,
  task: Task,
): Promise<void> {
  await database.runAsync(
    `
      UPDATE tasks
      SET
        title = ?,
        description = ?,
        category = ?,
        priority = ?,
        start_date = ?,
        due_date = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `,
    task.title,
    task.description,
    task.category,
    task.priority,
    task.startDate,
    task.dueDate,
    task.status,
    task.updatedAt,
    task.id,
  );
}

export async function deleteTask(
  database: SQLiteDatabase,
  id: string,
): Promise<void> {
  await database.runAsync("DELETE FROM tasks WHERE id = ?", id);
}

export async function deleteAllTasks(database: SQLiteDatabase): Promise<void> {
  await database.runAsync("DELETE FROM tasks");
}

export async function updateTaskStatus(
  database: SQLiteDatabase,
  id: string,
  status: TaskStatus,
): Promise<void> {
  await database.runAsync(
    `
      UPDATE tasks
      SET
        status = ?,
        updated_at = ?
      WHERE id = ?
    `,
    status,
    new Date().toISOString(),
    id,
  );
}
