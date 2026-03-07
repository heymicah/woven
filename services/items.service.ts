import api from "./api";
import { Item } from "../types";

export const itemsService = {
  getAll: async (params?: Record<string, string>): Promise<Item[]> => {
    const { data } = await api.get<Item[]>("/items", { params });
    return data;
  },

  getById: async (id: string): Promise<Item> => {
    const { data } = await api.get<Item>(`/items/${id}`);
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
