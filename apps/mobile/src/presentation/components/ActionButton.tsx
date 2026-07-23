import { Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";
import { appStyles } from "../theme/styles";

interface ActionButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: "primary" | "secondary" | "danger";
}

export function ActionButton({ label, variant = "primary", disabled, ...props }: ActionButtonProps) {
  const buttonStyle =
    variant === "primary"
      ? appStyles.primaryButton
      : variant === "danger"
        ? appStyles.dangerButton
        : appStyles.secondaryButton;
  const textStyle = variant === "primary" ? appStyles.buttonTextDark : appStyles.buttonTextLight;

  return (
    <TouchableOpacity activeOpacity={0.82} disabled={disabled} style={[buttonStyle, disabled && { opacity: 0.55 }]} {...props}>
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}
