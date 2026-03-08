import api from "./api";

function getFileName(uri: string): string {
  return uri.split("/").pop() || "image.jpg";
}

function getMimeType(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

export const uploadService = {
  uploadImage: async (uri: string): Promise<string> => {
    const formData = new FormData();
    formData.append("image", {
      uri,
      name: getFileName(uri),
      type: getMimeType(uri),
    } as any);

    const { data } = await api.post<{ url: string }>("/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.url;
  },

  uploadImages: async (uris: string[]): Promise<string[]> => {
    const formData = new FormData();
    uris.forEach((uri) => {
      formData.append("images", {
        uri,
        name: getFileName(uri),
        type: getMimeType(uri),
      } as any);
    });

    const { data } = await api.post<{ urls: string[] }>("/upload/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.urls;
  },
};
