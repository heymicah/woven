import { Image } from "react-native";

export const ratioCache: { [key: string]: number } = {};

/**
 * Standardizes raw aspect ratios into Portrait (3:4), Square (1:1), or Landscape (4:3)
 */
export const binAspectRatio = (rawRatio: number): number => {
    if (rawRatio < 0.85) return 0.75; // 3:4
    if (rawRatio > 1.15) return 1.33; // 4:3
    return 1; // Square
};

/**
 * Fetches the aspect ratio of a single image and bins it
 */
export const getBinnedAspectRatio = (uri: string): Promise<number> => {
    if (ratioCache[uri]) return Promise.resolve(ratioCache[uri]);

    return new Promise((resolve) => {
        Image.getSize(
            uri,
            (width, height) => {
                const binned = binAspectRatio(width / height);
                ratioCache[uri] = binned;
                resolve(binned);
            },
            () => {
                ratioCache[uri] = 1;
                resolve(1);
            }
        );
    });
};

/**
 * Fetches multiple aspect ratios in parallel
 */
export const fetchAspectRatiosBatch = async (uris: string[]): Promise<{ [key: string]: number }> => {
    const uniqueUris = Array.from(new Set(uris.filter(Boolean)));
    const results = await Promise.all(
        uniqueUris.map(async (uri) => ({
            uri,
            ratio: await getBinnedAspectRatio(uri),
        }))
    );

    const map: { [key: string]: number } = {};
    results.forEach((res) => {
        map[res.uri] = res.ratio;
    });
    return map;
};
