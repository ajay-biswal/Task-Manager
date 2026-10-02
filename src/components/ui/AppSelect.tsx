import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";

interface AppSelectProps {
  label?: string;
  value: string;
  options: string[];
  placeholder?: string;
  error?: string;
  onChange: (value: string) => void;
}

export function AppSelect({
  label,
  value,
  options,
  placeholder = "Select an option",
  error,
  onChange,
}: AppSelectProps) {
  const [visible, setVisible] = useState(false);

  function handleSelect(option: string) {
    onChange(option);
    setVisible(false);
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text> : null}

      <Pressable
        onPress={() => setVisible(true)}
        style={[styles.trigger, { borderColor: colors.input, backgroundColor: colors.background }, error ? { borderColor: colors.destructive } : null]}
      >
        <Text style={[styles.value, { color: colors.foreground }, !value ? { color: colors.mutedForeground } : null]}>
          {value || placeholder}
        </Text>

        <Text style={[styles.chevron, { color: colors.mutedForeground }]}>▼</Text>
      </Pressable>

      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{label ?? "Select"}</Text>

              <Pressable onPress={() => setVisible(false)} hitSlop={10}>
                <Text style={[styles.closeButton, { color: colors.mutedForeground }]}>×</Text>
              </Pressable>
            </View>

            <View style={styles.options}>
              {options.map((option) => {
                const selected = option === value;

                return (
                  <Pressable
                    key={option}
                    onPress={() => handleSelect(option)}
                    style={[
                      styles.option,
                      selected ? { backgroundColor: colors.muted } : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected ? styles.selectedOptionText : null, { color: colors.foreground },
                      ]}
                    >
                      {option}
                    </Text>

                    {selected ? <Text style={[styles.checkmark, { color: colors.foreground }]}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },

  label: {
    fontSize: typography.sm,
    fontWeight: "500",  },

  trigger: {
    minHeight: 46,
    borderWidth: 1,    borderRadius: 10,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  modalTitle: {
    fontSize: typography.lg,
    fontWeight: "600",  },

  closeButton: {
    fontSize: 28,
    lineHeight: 28,  },

  options: {
    gap: spacing.sm,
  },

  option: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectedOption: {  },

  optionText: {
    fontSize: typography.md,  },

  selectedOptionText: {
    fontWeight: "600",
  },

  checkmark: {
    fontSize: typography.lg,  },
});
