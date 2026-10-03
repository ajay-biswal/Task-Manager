import { SymbolView } from "expo-symbols";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";

interface AppIconProps {
  name: {
    ios: string;
    android: string;
    web: string;
  };
  size?: number;
  color: ColorValue;
  style?: StyleProp<ViewStyle>;
}

export function AppIcon({
  name,
  size = 20,
  color,
  style,
}: AppIconProps) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      style={style}
    />
  );
}
