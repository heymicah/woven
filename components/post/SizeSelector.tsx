import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Keyboard } from "react-native";
import { Colors } from "../../constants/Colors";

// Size dataset organised by category type
const SIZE_GROUPS = [
  {
    label: "Tops & Outerwear",
    sizes: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  },
  {
    label: "Men's Pants & Jeans (W×L)",
    sizes: [
      "26×28", "26×30", "26×32",
      "28×28", "28×30", "28×32", "28×34",
      "30×28", "30×30", "30×32", "30×34",
      "32×28", "32×30", "32×32", "32×34",
      "34×28", "34×30", "34×32", "34×34",
      "36×30", "36×32", "36×34",
      "38×30", "38×32", "38×34",
      "40×30", "40×32",
    ],
  },
  {
    label: "Women's Pants & Jeans (Waist)",
    sizes: ["23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"],
  },
  {
    label: "Dresses, Skirts & Shorts (Numeric)",
    sizes: ["00", "0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20"],
  },
  {
    label: "Shoes (US)",
    sizes: [
      "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5",
      "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5",
      "12", "12.5", "13", "14",
    ],
  },
  {
    label: "Universal",
    sizes: ["One Size", "S/M", "M/L"],
  },
];

interface SizeSelectorProps {
  selected: string;
  onSelect: (size: string) => void;
}

export default function SizeSelector({ selected, onSelect }: SizeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  function handleSelect(size: string) {
    onSelect(size);
    setIsOpen(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Size<Text style={{ color: Colors.error }}> *</Text></Text>

      {/* Collapsed row — shows current selection */}
      <Pressable
        onPress={() => { Keyboard.dismiss(); setIsOpen(true); }}
        style={styles.selector}
        accessibilityRole="button"
        accessibilityLabel={`Select size${selected ? `, current: ${selected}` : ""}`}
      >
        <Text style={[styles.selectorText, !selected && styles.placeholder]}>
          {selected || "Select a size"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
      </Pressable>

      {/* Bottom-sheet modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Size</Text>
            <Pressable onPress={() => setIsOpen(false)} hitSlop={12}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {SIZE_GROUPS.map((group) => (
              <View key={group.label} style={styles.group}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                <View style={styles.chipGrid}>
                  {group.sizes.map((size) => {
                    const isActive = selected === size;
                    return (
                      <Pressable
                        key={size}
                        onPress={() => handleSelect(size)}
                        style={[
                          styles.chip,
                          isActive ? styles.chipActive : styles.chipInactive,
                        ]}
                        accessibilityState={{ selected: isActive }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isActive
                              ? styles.chipTextActive
                              : styles.chipTextInactive,
                          ]}
                        >
                          {size}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            {/* Bottom spacing */}
            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </Modal>
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
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF1DA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 46,
  },
  selectorText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: "Quicksand_500Medium",
  },
  placeholder: {
    color: Colors.textSecondary,
  },
  // Bottom sheet
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#FFF1DA",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "65%",
    paddingBottom: 20,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Quicksand_700Bold",
  },
  scrollArea: {
    paddingHorizontal: 20,
  },
  group: {
    marginBottom: 16,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Quicksand_600SemiBold",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: Colors.brown.dark,
  },
  chipInactive: {
    backgroundColor: "#FAE5C4",
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    color: Colors.text,
  },
});
