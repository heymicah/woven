import api from "./api";
import { Item } from "../types";

export const itemsService = {
  getAll: async (params?: { category?: string; size?: string; condition?: string; search?: string; userId?: string; status?: string }): Promise<Item[]> => {
    const { data } = await api.get<Item[]>("/items", { params });
    return data;
  },

  getById: async (id: string): Promise<Item> => {
    const { data } = await api.get<Item>(`/items/${id}`);
    return data;
  },

  getMine: async (): Promise<Item[]> => {
    const { data } = await api.get<Item[]>("/items/mine");
    return data;
  },

  getClaimed: async (): Promise<Item[]> => {
    const { data } = await api.get<Item[]>("/items/claimed");
    return data;
  },

  getLiked: async (): Promise<Item[]> => {
    const { data } = await api.get<Item[]>("/items/liked");
    return data;
  },

  create: async (item: Partial<Item>): Promise<Item> => {
    const { data } = await api.post<Item>("/items", item);
    return data;
  },

  claim: async (id: string): Promise<Item> => {
    const { data } = await api.post<Item>(`/items/${id}/claim`);
    return data;
  },

  update: async (id: string, item: Partial<Item>): Promise<Item> => {
    const { data } = await api.put<Item>(`/items/${id}`, item);
    return data;
  },

  toggleLike: async (id: string): Promise<{ liked: boolean }> => {
    const { data } = await api.post<{ liked: boolean }>(`/items/${id}/toggle-like`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/items/${id}`);
  },
};
