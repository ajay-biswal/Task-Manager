import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { initializeDatabase } from "@/database/database";

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="taskflow.db" onInit={initializeDatabase}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "TaskFlow",
          }}
        />

        <Stack.Screen
          name="tasks/form"
          options={{
            title: "Task",
          }}
        />
      </Stack>
    </SQLiteProvider>
  );
}
