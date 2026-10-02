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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Manage your TaskFlow preferences.</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Appearance</Text>

          <View style={[styles.settingRow, { borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Dark mode</Text>

              <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>
                Use a darker appearance throughout TaskFlow.
              </Text>
            </View>

            <Switch value={isDark} onValueChange={toggleTheme} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Data</Text>

          <AppButton
            title="Clear All Tasks"
            variant="destructive"
            onPress={handleClearTasks}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>

          <View style={[styles.aboutCard, { borderColor: colors.border }]}>
            <Text style={[styles.appName, { color: colors.foreground }]}>TaskFlow</Text>

            <Text style={[styles.version, { color: colors.mutedForeground }]}>Local-first task management</Text>

            <Text style={[styles.version, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
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
  },

  subtitle: {
    fontSize: typography.sm,
  },

  section: {
    gap: spacing.md,
  },

  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: "600",
  },

  settingRow: {
    minHeight: 72,
    borderWidth: 1,
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
  },

  settingDescription: {
    fontSize: typography.xs,
  },

  aboutCard: {
    borderWidth: 1,
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
  },

  backButton: {
    marginTop: "auto",
  },
});
