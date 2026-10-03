import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/ui/AppIcon";
import { Dialog } from "@/components/ui";
import { useTasks } from "@/hooks/useTasks";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { clearTasks } = useTasks();
  const { isDark, colors, toggleTheme } = useTheme();
  const [dialog, setDialog] = useState<{
    title: string;
    message?: string;
    actions: {
      label: string;
      variant?: "default" | "cancel" | "danger";
      onPress: () => void | Promise<void>;
    }[];
  } | null>(null);
  const styles = createStyles(colors);

  function handleClearTasks() {
    setDialog({
      title: "Clear all tasks",
      message: "This will permanently delete all tasks from this device.",
      actions: [
        {
          label: "Cancel",
          variant: "cancel",
          onPress: () => setDialog(null),
        },
        {
          label: "Clear all",
          variant: "danger",
          onPress: async () => {
            setDialog(null);

            try {
              await clearTasks();
            } catch (error) {
              console.error("Failed to clear tasks:", error);
              setDialog({
                title: "Clear failed",
                message: "Unable to clear tasks. Please try again.",
                actions: [
                  {
                    label: "OK",
                    onPress: () => setDialog(null),
                  },
                ],
              });
            }
          },
        },
      ],
    });
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

      <Dialog
        visible={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message}
        actions={dialog?.actions ?? []}
        onRequestClose={() => setDialog(null)}
      />
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
      marginBottom: spacing.lg,
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
      marginBottom: spacing.xs,
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
      borderColor: colors.destructive + "55",
    },
    rowIcon: {
      width: 40,
      height: 40,
      marginRight: spacing.md,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent + "12",
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
