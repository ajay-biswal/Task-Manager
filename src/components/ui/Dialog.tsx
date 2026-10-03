import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { useTheme } from "@/theme/ThemeContext";

export type DialogAction = {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: "default" | "cancel" | "danger";
  disabled?: boolean;
};

type DialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  actions: DialogAction[];
  onRequestClose: () => void;
};

export default function Dialog({
  visible,
  title,
  message,
  actions,
  onRequestClose,
}: DialogProps) {
  const { colors } = useTheme();
  const [activeAction, setActiveAction] = useState<string | null>(null);

  async function handleAction(action: DialogAction) {
    if (activeAction !== null || action.disabled) return;

    setActiveAction(action.label);

    try {
      await action.onPress();
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>

          {message ? (
            <Text style={[styles.message, { color: colors.mutedForeground }]}>
              {message}
            </Text>
          ) : null}

          <View style={styles.actions}>
            {actions.map((action) => {
              const actionColor =
                action.variant === "danger"
                  ? colors.destructive
                  : action.variant === "cancel"
                    ? colors.mutedForeground
                    : colors.primary;

              return (
                <Pressable
                  key={action.label}
                  onPress={() => handleAction(action)}
                  disabled={action.disabled || activeAction !== null}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  accessibilityState={{
                    disabled: action.disabled || activeAction !== null,
                    busy: activeAction === action.label,
                  }}
                  style={({ pressed }) => [
                    styles.action,
                    pressed && !action.disabled && styles.pressed,
                    (action.disabled || activeAction !== null) && styles.disabled,
                  ]}
                >
                  <Text style={[styles.actionText, { color: actionColor }]}>
                    {action.label.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "rgba(0, 0, 0, 0.58)",
  },
  dialog: {
    width: "100%",
    maxWidth: 600,
    borderWidth: 1,
    borderRadius: 18,
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  message: {
    marginTop: 14,
    fontSize: 17,
    lineHeight: 25,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 24,
  },
  action: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  pressed: {
    backgroundColor: "rgba(127, 127, 127, 0.10)",
  },
  disabled: {
    opacity: 0.45,
  },
});
