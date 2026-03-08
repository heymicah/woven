import React, { useState, useEffect } from "react";
import { Image, View, ActivityIndicator, Pressable } from "react-native";
import { Colors } from "../constants/Colors";

interface MasonryImageProps {
    uri: string;
    onPress: () => void;
    columnWidth: number;
    aspectRatio?: number;
}

const ratioCache: { [key: string]: number } = {};

export function MasonryImage({ uri, onPress, columnWidth, aspectRatio: initialRatio }: MasonryImageProps) {
    const [aspectRatio, setAspectRatio] = useState(initialRatio || ratioCache[uri] || 1); // Prefer initial, then cache, then square
    const [loading, setLoading] = useState(!initialRatio && !ratioCache[uri]);

    useEffect(() => {
        if (!uri || ratioCache[uri]) return;

        Image.getSize(
            uri,
            (width, height) => {
                const rawRatio = width / height;
                let binnedRatio = 1;

                if (rawRatio < 0.85) {
                    binnedRatio = 0.75; // 3:4 Portrait
                } else if (rawRatio > 1.15) {
                    binnedRatio = 1.33; // 4:3 Landscape
                } else {
                    binnedRatio = 1; // Square
                }

                ratioCache[uri] = binnedRatio;
                setAspectRatio(binnedRatio);
                setLoading(false);
            },
            (error) => {
                console.error("Failed to get image size:", error);
                setLoading(false);
            }
        );
    }, [uri]);

    return (
        <View
            style={{
                width: "100%",
                marginBottom: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 5,
            }}
        >
            <Pressable
                onPress={onPress}
                style={{
                    width: "100%",
                    aspectRatio,
                    borderRadius: 16,
                    backgroundColor: "#C4DBC4",
                    overflow: "hidden",
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
        </View>
    );
}
