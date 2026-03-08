const isProduction = process.env.EXPO_PUBLIC_PRODUCTION === "true";

export const API_URL = isProduction
  ? process.env.EXPO_PUBLIC_PROD_API_URL!
  : process.env.EXPO_PUBLIC_DEV_API_URL!;

export const INITIAL_TOKEN_BALANCE = 2;
export const POST_REWARD = 1;
