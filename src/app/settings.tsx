import { useState } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomNavigation } from "@/components/BottomNavigation";
import { AppIcon } from "@/components/ui/AppIcon";
import { useTasks } from "@/hooks/useTasks";
import { exportTasksToCsv } from "@/services/taskExport";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks, clearTasks } = useTasks();
  const { isDark, colors, toggleTheme } = useTheme();
  const [exporting, setExporting] = useState(false);
  const styles = createStyles(colors);

  async function handleExportTasks() {
    if (tasks.length === 0) {
      Alert.alert("No tasks", "There are no tasks to export.");
      return;
    }

    try {
      setExporting(true);
      await exportTasksToCsv(tasks);
      Alert.alert(
        "Export complete",
        `${tasks.length} task(s) were exported successfully.`,
      );
    } catch (error) {
      console.error("Failed to export tasks:", error);
      Alert.alert("Export failed", "Unable to export tasks as a CSV file.");
    } finally {
      setExporting(false);
    }
  }

  function handleClearTasks() {
    Alert.alert(
      "Clear all tasks",
      "This will permanently delete all tasks from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearTasks();
              Alert.alert("Tasks cleared", "All tasks have been removed.");
            } catch (error) {
              console.error("Failed to clear tasks:", error);
              Alert.alert("Error", "Unable to clear tasks.");
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: 110 + insets.bottom,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your TaskFlow preferences.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <AppIcon
                name={{ ios: "moon.fill", android: "dark_mode", web: "dark_mode" }}
                size={20}
                color={colors.accent}
              />
            </View>

            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Dark mode</Text>
              <Text style={styles.rowDescription}>
                Use a darker appearance throughout TaskFlow.
              </Text>
            </View>

            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.card}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>

          <Pressable
            onPress={handleExportTasks}
            disabled={exporting}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          >
            <View style={styles.actionIcon}>
              <AppIcon
                name={{
                  ios: "square.and.arrow.up",
                  android: "file_download",
                  web: "file_download",
                }}
                size={20}
                color={colors.foreground}
              />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>
                {exporting ? "Exporting..." : "Export tasks"}
              </Text>
              <Text style={styles.rowDescription}>
                Share your tasks as a CSV file.
              </Text>
            </View>
            <AppIcon
              name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>

          <Pressable
            onPress={handleClearTasks}
            style={({ pressed }) => [
              styles.actionRow,
              styles.destructiveRow,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.actionIcon, styles.destructiveIcon]}>
              <AppIcon
                name={{ ios: "trash", android: "delete", web: "delete" }}
                size={20}
                color={colors.destructive}
              />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, styles.destructiveText]}>
                Clear all tasks
              </Text>
              <Text style={styles.rowDescription}>
                Permanently remove all local tasks.
              </Text>
            </View>
            <AppIcon
              name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.aboutCard}>
            <View style={styles.aboutIcon}>
              <AppIcon
                name={{ ios: "checkmark.circle.fill", android: "task_alt", web: "task_alt" }}
                size={24}
                color={colors.accent}
              />
            </View>

            <View style={styles.rowContent}>
              <Text style={styles.appName}>TaskFlow</Text>
              <Text style={styles.rowDescription}>
                Local-first task management
              </Text>
              <Text style={styles.version}>Version 1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: spacing.lg,
    },
    header: {
      marginBottom: spacing.xl,
    },
    title: {
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "700",
      color: colors.foreground,
    },
    subtitle: {
      marginTop: spacing.xs,
      fontSize: typography.sm,
      color: colors.mutedForeground,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      marginBottom: spacing.sm,
      fontSize: typography.sm,
      fontWeight: "700",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    row: {
      minHeight: 78,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
    },
    actionRow: {
      minHeight: 74,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
    },
    destructiveRow: {
      borderColor: colors.destructive,
    },
    rowIcon: {
      width: 40,
      height: 40,
      marginRight: spacing.md,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
    },
    actionIcon: {
      width: 40,
      height: 40,
      marginRight: spacing.md,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
    },
    destructiveIcon: {
      backgroundColor: colors.background,
    },
    aboutIcon: {
      width: 46,
      height: 46,
      marginRight: spacing.md,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
    },
    rowContent: {
      flex: 1,
      gap: 3,
    },
    rowTitle: {
      fontSize: typography.md,
      fontWeight: "600",
      color: colors.foreground,
    },
    rowDescription: {
      fontSize: typography.xs,
      lineHeight: 17,
      color: colors.mutedForeground,
    },
    destructiveText: {
      color: colors.destructive,
    },
    aboutCard: {
      minHeight: 82,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
    },
    appName: {
      fontSize: typography.md,
      fontWeight: "700",
      color: colors.foreground,
    },
    version: {
      marginTop: 2,
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
