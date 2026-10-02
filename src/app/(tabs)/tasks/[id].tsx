import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/ui/AppIcon";
import { useTasks } from "@/hooks/useTasks";
import type { ThemeColors } from "@/theme";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { Task } from "@/types/task";
import { formatDate, formatDateTime } from "@/utils/dateUtils";

function SectionCard({
  icon,
  title,
  colors,
  children,
}: {
  icon: string;
  title: string;
  colors: ThemeColors;
  children: ReactNode;
}) {
  const iconName: SectionIcon = {
    ios:
      icon === "description"
        ? "doc.text"
        : icon === "list_alt"
          ? "list.bullet"
          : "clock.arrow.circlepath",
    android: icon,
    web: icon,
  };

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.muted }]}>
          <AppIcon name={iconName} size={16} color={colors.accent} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueColor,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  colors: ThemeColors;
}) {
  const iconName = {
    ios:
      icon === "calendar_today"
        ? "calendar"
        : icon === "schedule"
          ? "clock"
          : icon === "folder"
            ? "folder"
            : "flag",
    android: icon,
    web: icon,
  };

  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <View style={styles.detailLeft}>
        <AppIcon name={iconName} size={15} color={colors.mutedForeground} />
        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.detailValue,
          { color: valueColor ?? colors.foreground },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function ActivityRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.activityRow}>
      <Text style={[styles.activityLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.activityValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function capitalize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function getPriorityTextColor(priority: Task["priority"], colors: ThemeColors): string {
  if (priority === "HIGH") return colors.destructive;
  if (priority === "MEDIUM") return "#F59E0B";
  return colors.accent;
}

function getPriorityBackground(priority: Task["priority"], colors: ThemeColors): string {
  if (priority === "HIGH") return colors.destructive + "18";
  if (priority === "MEDIUM") return "#F59E0B18";
  return colors.accent + "18";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 12,
  },
  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  topIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },
  summaryCard: {
    minHeight: 104,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryMain: {
    flex: 1,
    minWidth: 0,
    paddingRight: 14,
    gap: 10,
  },
  title: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "800",
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priorityBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  priorityText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  statusBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    paddingLeft: 46,
  },
  detailRow: {
    minHeight: 38,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  detailValue: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "right",
  },
  activityRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  activityLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  activityValue: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "right",
    fontWeight: "600",
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  deleteButton: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  deleteText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  pressed: { opacity: 0.75 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  stateText: { fontSize: typography.sm },
  stateTitle: { fontSize: typography.xl, fontWeight: "700" },
  link: { fontSize: typography.sm, fontWeight: "600" },
});
