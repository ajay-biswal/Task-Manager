import { StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";

import { useTheme } from "@/theme/ThemeContext";

type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export default function EmptyState({
  title,
  message,
  icon,
  action,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {icon ? (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.muted },
          ]}
        >
          {icon}
        </View>
      ) : null}

      <Text style={[styles.title, { color: colors.foreground }]}>
        {title}
      </Text>

      {message ? (
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          {message}
        </Text>
      ) : null}

      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    marginTop: 6,
    maxWidth: 300,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  action: {
    marginTop: 20,
  },
});
