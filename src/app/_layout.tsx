import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { initializeDatabase } from "@/database/database";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext";

function AppNavigator() {
  const { isDark, colors } = useTheme();

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
        contentStyle: {
          backgroundColor: colors.background,
        },
        statusBarStyle: isDark ? "light" : "dark",
        statusBarColor: colors.background,
        navigationBarColor: colors.background,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="tasks/form"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="tasks/[id]"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="calendar"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
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
