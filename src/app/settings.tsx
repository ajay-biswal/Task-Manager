import { useRouter } from "expo-router";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { useTasks } from "@/hooks/useTasks";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { clearTasks } = useTasks();
  const { isDark, colors, toggleTheme } = useTheme();

  function handleClearTasks() {
    Alert.alert(
      "Clear all tasks",
      "This will permanently delete all tasks from this device.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
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
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>

          <Text style={styles.subtitle}>Manage your TaskFlow preferences.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Dark mode</Text>

              <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>
                Use a darker appearance throughout TaskFlow.
              </Text>
            </View>

            <Switch value={isDark} onValueChange={toggleTheme} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>

          <AppButton
            title="Clear All Tasks"
            variant="destructive"
            onPress={handleClearTasks}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.aboutCard}>
            <Text style={styles.appName}>TaskFlow</Text>

            <Text style={styles.version}>Local-first task management</Text>

            <Text style={styles.version}>Version 1.0.0</Text>
          </View>
        </View>

        <View style={styles.backButton}>
          <AppButton
            title="Back to Dashboard"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.xl,
    gap: spacing.xxl,
  },

  header: {
    gap: spacing.xs,
  },

  title: {
    fontSize: typography.xxxl,
    fontWeight: "700",
    color: colors.foreground,
  },

  subtitle: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },

  section: {
    gap: spacing.md,
  },

  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: "600",
    color: colors.light.foreground,
  },

  settingRow: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  settingContent: {
    flex: 1,
    marginRight: spacing.lg,
    gap: spacing.xs,
  },

  settingTitle: {
    fontSize: typography.md,
    fontWeight: "500",
    color: colors.light.foreground,
  },

  settingDescription: {
    fontSize: typography.xs,
    color: colors.light.mutedForeground,
  },

  aboutCard: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.xs,
  },

  appName: {
    fontSize: typography.md,
    fontWeight: "600",
    color: colors.light.foreground,
  },

  version: {
    fontSize: typography.sm,
    color: colors.light.mutedForeground,
  },

  backButton: {
    marginTop: "auto",
  },
});
