import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { initializeDatabase } from "@/database/database";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext";

function AppNavigator() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          color: colors.foreground,
        },
      }}
    >
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
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SQLiteProvider databaseName="taskflow.db" onInit={initializeDatabase}>
        <AppNavigator />
      </SQLiteProvider>
    </ThemeProvider>
  );
}
