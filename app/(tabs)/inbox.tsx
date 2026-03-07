import React from "react";
import { View, Text, SectionList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

// TODO: Fetch real claim data from the API
const SECTIONS = [
  {
    title: "Claims Received",
    data: [] as string[],
  },
  {
    title: "Claims Made",
    data: [] as string[],
  },
];

export default function InboxScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SectionList
        sections={SECTIONS}
        keyExtractor={(item, index) => item + index}
        renderSectionHeader={({ section: { title } }) => (
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.background }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: Colors.text }}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="px-4 py-3 bg-white border-b border-gray-100">
            <Text>{item}</Text>
          </View>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <View className="items-center py-10 bg-white mx-4 rounded-xl mb-4">
              <Ionicons
                name={
                  section.title === "Claims Received"
                    ? "arrow-down-circle-outline"
                    : "arrow-up-circle-outline"
                }
                size={32}
                color={Colors.border}
              />
              <Text className="text-gray-400 mt-2">
                {section.title === "Claims Received"
                  ? "No one has claimed your items yet"
                  : "You haven't claimed any items yet"}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingTop: 8 }}
      />
    </View>
  );
}
