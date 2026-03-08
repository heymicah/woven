import api from "./api";
import { User } from "../types";

export const userService = {
    getById: async (id: string): Promise<User> => {
        const { data } = await api.get<User>(`/users/${id}`);
        return data;
    },
};
