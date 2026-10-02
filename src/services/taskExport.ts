import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import Papa from "papaparse";

import type { Task } from "@/types/task";

export async function exportTasksToCsv(tasks: Task[]): Promise<void> {
  const csv = Papa.unparse(
    tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      start_date: task.startDate,
      due_date: task.dueDate,
      status: task.status,
    })),
  );

  const file = new File(
    Paths.cache,
    `taskflow-export-${new Date().toISOString().slice(0, 10)}.csv`,
  );

  file.write(csv);

  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error("File sharing is not available on this device.");
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: "Export TaskFlow tasks",
    UTI: "public.comma-separated-values-text",
  });
}
