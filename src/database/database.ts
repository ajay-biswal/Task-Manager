import type { SQLiteDatabase } from "expo-sqlite";

export async function initializeDatabase(
  database: SQLiteDatabase,
): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      priority TEXT NOT NULL CHECK (
        priority IN ('LOW', 'MEDIUM', 'HIGH')
      ),
      start_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'COMPLETED')
      ),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status
      ON tasks(status);

    CREATE INDEX IF NOT EXISTS idx_tasks_priority
      ON tasks(priority);

    CREATE INDEX IF NOT EXISTS idx_tasks_due_date
      ON tasks(due_date);

    CREATE INDEX IF NOT EXISTS idx_tasks_category
      ON tasks(category);
  `);
}
