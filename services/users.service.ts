import api from "./api";
import { User } from "../types";

export const usersService = {
  getById: async (id: string): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  updateMe: async (updates: Partial<User>): Promise<User> => {
    const { data } = await api.put<User>("/users/me", updates);
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put("/users/me/password", { currentPassword, newPassword });
  },
};
