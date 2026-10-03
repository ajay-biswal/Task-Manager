import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppIcon } from "@/components/ui/AppIcon";
import { useTheme } from "@/theme/ThemeContext";

const defaultCategories = ["Work", "Personal", "Study", "Health", "Other"];

const categoryIcons = {
  Work: { ios: "briefcase.fill", android: "business_center", web: "business_center" },
  Personal: { ios: "house.fill", android: "home", web: "home" },
  Study: { ios: "graduationcap.fill", android: "school", web: "school" },
  Health: { ios: "heart.fill", android: "favorite", web: "favorite" },
  Other: { ios: "ellipsis", android: "more_horiz", web: "more_horiz" },
} as const;

type Props = {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  error?: string;
};

export default function TaskCategorySelector({
  value,
  onChange,
  options = defaultCategories,
  error,
}: Props) {
  const { colors } = useTheme();
  const categories = value && !options.includes(value) ? [...options, value] : options;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {categories.map((category) => {
          const selected = value === category;
          const icon =
            category in categoryIcons
              ? categoryIcons[category as keyof typeof categoryIcons]
              : categoryIcons.Other;

          return (
            <Pressable
              key={category}
              onPress={() => onChange(category)}
              accessibilityRole="radio"
              accessibilityLabel={category}
              accessibilityState={{ selected }}
              style={[
                styles.option,
                {
                  backgroundColor: selected ? colors.accent + "12" : colors.muted,
                  borderColor: selected ? colors.accent : colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.icon,
                  {
                    backgroundColor: selected ? colors.accent + "18" : colors.background,
                  },
                ]}
              >
                <AppIcon
                  name={icon}
                  size={19}
                  color={selected ? colors.accent : colors.mutedForeground}
                />
              </View>
              <Text numberOfLines={1} style={[styles.text, { color: colors.foreground }]}>
                {category}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 7 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  option: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 92,
    minHeight: 82,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 12, lineHeight: 16, fontWeight: "700" },
  error: { fontSize: 11, lineHeight: 15 },
});
