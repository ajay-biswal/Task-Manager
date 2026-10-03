import { Pressable, StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { ReactNode } from "react";

import { useTheme } from "@/theme/ThemeContext";

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  variant?: "default" | "outlined" | "muted";
  padding?: "none" | "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
};

export default function Card({
  children,
  onPress,
  variant = "default",
  padding = "md",
  style,
}: CardProps) {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        styles.card,
        styles[padding],
        {
          backgroundColor:
            variant === "muted" ? colors.muted : colors.card,
          borderColor: colors.border,
        },
        variant === "outlined" && styles.outlined,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  outlined: {
    borderWidth: 1,
  },
  none: {
    padding: 0,
  },
  sm: {
    padding: 12,
  },
  md: {
    padding: 16,
  },
  lg: {
    padding: 20,
  },
  pressed: {
    opacity: 0.82,
  },
});
