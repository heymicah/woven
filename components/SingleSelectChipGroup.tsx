import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Colors } from "../constants/Colors";

export interface ChipOption {
  value: string;
  label: string;
}

interface SingleSelectChipGroupProps {
  label: string;
  options: ChipOption[];
  selected: string;
  onSelect: (value: string) => void;
  /** If true, chips wrap instead of scrolling horizontally */
  wrap?: boolean;
}

export default function SingleSelectChipGroup({
  label,
  options,
  selected,
  onSelect,
  wrap = true,
}: SingleSelectChipGroupProps) {
  const chips = options.map((opt) => {
    const isActive = selected === opt.value;
    return (
      <Pressable
        key={opt.value}
        onPress={() => onSelect(opt.value)}
        style={[
          styles.chip,
          isActive ? styles.chipActive : styles.chipInactive,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={`${opt.label}${isActive ? ", selected" : ""}`}
      >
        <Text
          style={[
            styles.chipText,
            isActive ? styles.chipTextActive : styles.chipTextInactive,
          ]}
        >
          {opt.label}
        </Text>
      </Pressable>
    );
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {wrap ? (
        <View style={styles.wrapContainer}>{chips}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {chips}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
    fontFamily: "Quicksand_600SemiBold",
  },
  wrapContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scrollContainer: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    minHeight: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: Colors.secondary,
  },
  chipInactive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: "Quicksand_600SemiBold",
  },
  chipTextInactive: {
    color: Colors.textSecondary,
  },
});
