import React, { useState, useEffect } from "react";
import { Image, View, ActivityIndicator, Pressable } from "react-native";
import { Colors } from "../constants/Colors";

interface MasonryImageProps {
    uri: string;
    onPress: () => void;
    columnWidth: number;
}

export function MasonryImage({ uri, onPress, columnWidth }: MasonryImageProps) {
    const [aspectRatio, setAspectRatio] = useState(1); // Default to square
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uri) return;

        Image.getSize(
            uri,
            (width, height) => {
                setAspectRatio(width / height);
                setLoading(false);
            },
            (error) => {
                console.error("Failed to get image size:", error);
                setLoading(false);
            }
        );
    }, [uri]);

    return (
        <Pressable
            onPress={onPress}
            style={{
                width: "100%",
                aspectRatio,
                marginBottom: 12,
                borderRadius: 16,
                backgroundColor: "#C4DBC4",
                overflow: "hidden",
                borderWidth: 1,
                borderColor: Colors.border || "#e5e7eb",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Image
                source={{ uri }}
                style={{
                    width: "100%",
                    height: "100%",
                }}
                resizeMode="cover"
            />
            {loading && (
                <View style={{ position: "absolute" }}>
                    <ActivityIndicator color={Colors.primary} />
                </View>
            )}
        </Pressable>
    );
}
