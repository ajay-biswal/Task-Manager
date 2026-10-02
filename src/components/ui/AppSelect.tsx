import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";

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
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        onPress={() => setVisible(true)}
        style={[styles.trigger, error ? styles.triggerError : null]}
      >
        <Text style={[styles.value, !value ? styles.placeholder : null]}>
          {value || placeholder}
        </Text>

        <Text style={styles.chevron}>▼</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label ?? "Select"}</Text>

              <Pressable onPress={() => setVisible(false)} hitSlop={10}>
                <Text style={styles.closeButton}>×</Text>
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
                      selected ? styles.selectedOption : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected ? styles.selectedOptionText : null,
                      ]}
                    >
                      {option}
                    </Text>

                    {selected ? <Text style={styles.checkmark}>✓</Text> : null}
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
    fontWeight: "500",
    color: colors.light.foreground,
  },

  trigger: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.light.input,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.light.background,
  },

  triggerError: {
    borderColor: colors.light.destructive,
  },

  value: {
    fontSize: typography.md,
    color: colors.light.foreground,
  },

  placeholder: {
    color: colors.light.mutedForeground,
  },

  chevron: {
    fontSize: 12,
    color: colors.light.mutedForeground,
  },

  error: {
    fontSize: typography.xs,
    color: colors.light.destructive,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },

  modal: {
    backgroundColor: colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  modalTitle: {
    fontSize: typography.lg,
    fontWeight: "600",
    color: colors.light.foreground,
  },

  closeButton: {
    fontSize: 28,
    lineHeight: 28,
    color: colors.light.mutedForeground,
  },

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

  selectedOption: {
    backgroundColor: colors.light.muted,
  },

  optionText: {
    fontSize: typography.md,
    color: colors.light.foreground,
  },

  selectedOptionText: {
    fontWeight: "600",
  },

  checkmark: {
    fontSize: typography.lg,
    color: colors.light.foreground,
  },
});
