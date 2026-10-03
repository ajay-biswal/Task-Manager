import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme/ThemeContext";

type DividerProps = {
  spacing?: "none" | "sm" | "md" | "lg";
};

export default function Divider({ spacing = "md" }: DividerProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.border,
        },
        styles[spacing],
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
  none: {
    marginVertical: 0,
  },
  sm: {
    marginVertical: 8,
  },
  md: {
    marginVertical: 16,
  },
  lg: {
    marginVertical: 24,
  },
});
