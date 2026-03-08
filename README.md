# Woven

Community clothing upcycling app

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Expo (SDK 55), Expo Router, NativeWind v4, TypeScript |
| Backend | Express.js + Mongoose + MongoDB |
| Auth | Email/Password with JWT (stored in expo-secure-store) |
| State | React Context (auth) |

## Environment Setup

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_PRODUCTION=false

EXPO_PUBLIC_DEV_API_URL=https://your-ngrok-url.ngrok-free.app/api
EXPO_PUBLIC_PROD_API_URL=https://woven-production.up.railway.app/api
```

- Set `EXPO_PUBLIC_PRODUCTION=true` to use the Railway production backend
- Set `EXPO_PUBLIC_PRODUCTION=false` to use your local/ngrok dev backend

**Note:** `EXPO_PUBLIC_*` variables are baked in at build time. You must rebuild the app after changing them.

## Getting Started

### Frontend

```bash
npm install
npm run start
```

### Backend (local development)

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Set the .env variables
PORT=3000
MONGODB_URI=mongodb://localhost:27017/woven
JWT_SECRET=your-secret-key-change-in-production
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
OPENAI_API_KEY=sk-your-openai-api-key

The production backend is deployed on Railway and requires no local setup as long as EXPO_PUBLIC_PRODUCTION=true
