import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as RouterThemeProvider,
} from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { initializeDatabase } from "@/database/database";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext";
import { TaskFormDraftProvider } from "@/context/TaskFormDraftContext";

function AppNavigator() {
  const { isDark, colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: { color: colors.foreground },
        contentStyle: { backgroundColor: colors.background },
        statusBarStyle: isDark ? "light" : "dark",
        statusBarColor: colors.background,
        navigationBarColor: colors.background,
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false, animation: "none" }}
      />
      <Stack.Screen
        name="bulk-upload"
        options={{
          headerShown: false,
          animation: "none",
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </Stack>
  );
}

function ThemedNavigator() {
  const { isDark } = useTheme();

  return (
    <RouterThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AppNavigator />
    </RouterThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <TaskFormDraftProvider>
        <SQLiteProvider databaseName="taskflow.db" onInit={initializeDatabase}>
          <ThemedNavigator />
        </SQLiteProvider>
      </TaskFormDraftProvider>
    </ThemeProvider>
  );
}
