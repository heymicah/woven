import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";

interface ThemedTextProps extends TextProps {
    variant?: "light" | "regular" | "medium" | "semibold" | "bold";
}

export function ThemedText({
    style,
    variant = "regular",
    ...rest
}: ThemedTextProps) {
    const fontFamily = {
        light: "Quicksand_300Light",
        regular: "Quicksand_400Regular",
        medium: "Quicksand_500Medium",
        semibold: "Quicksand_600SemiBold",
        bold: "Quicksand_700Bold",
    }[variant];

    return <Text style={[{ fontFamily }, style]} {...rest} />;
}
