import api from "./api";
import { Transaction } from "../types";

export const transactionsService = {
  getMyHistory: async (): Promise<Transaction[]> => {
    const { data } = await api.get<Transaction[]>("/transactions/me");
    return data;
  },
};
