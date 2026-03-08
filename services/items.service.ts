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

  create: async (item: Partial<Item>): Promise<Item> => {
    const { data } = await api.post<Item>("/items", item);
    return data;
  },

  claim: async (id: string): Promise<Item> => {
    const { data } = await api.post<Item>(`/items/${id}/claim`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/items/${id}`);
  },
};
