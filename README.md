# Woven

Community clothing upcycling app. Users exchange clothing using a token economy: posting items earns tokens, claiming items costs tokens, and new users start with 2 tokens.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Expo (SDK 55), Expo Router, NativeWind v4, TypeScript |
| Backend | Express.js + Mongoose + MongoDB |
| Auth | Email/Password with JWT (stored in expo-secure-store) |
| State | React Context (auth) |

## Project Structure

```
woven/
  app/             # Expo Router screens
    (auth)/        # Login & register screens
    (tabs)/        # 5-tab bottom navigation (Explore, Search, Post, Inbox, Profile)
  components/      # Reusable UI components
  context/         # React Context providers
  hooks/           # Custom hooks
  services/        # API service layer
  types/           # Shared TypeScript types
  constants/       # App config & colors
  server/          # Express.js backend
    src/
      config/      # Database connection
      controllers/ # Route handlers
      middleware/  # JWT auth middleware
      models/      # Mongoose models (User, Item, Transaction)
      routes/      # Express routes
      types/       # Server-side types
```

## Getting Started

### Frontend

```bash
npm install
npx expo start
```

### Backend

```bash
cd server
cp .env.example .env    # Edit with your MongoDB URI and JWT secret
npm install
npm run dev
```

Requires MongoDB running locally (default: `mongodb://localhost:27017/woven`).

## Auth Flow

1. User registers or logs in via `/api/auth/register` or `/api/auth/login`
2. Server returns JWT + user object
3. Token is stored in `expo-secure-store`
4. Axios interceptor attaches token to all API requests
5. Root layout redirects based on auth state

## Token Economy

| Action | Tokens |
|--------|--------|
| New user signup | +2 |
| Post an item | +1 |
| Claim an item | -1 |
| Minimum balance to claim | 1 |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/health | No | Health check |
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Sign in |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/items | No | List items (supports ?search, ?category, ?size, ?condition) |
| GET | /api/items/:id | No | Get single item |
| POST | /api/items | Yes | Create item (+1 token) |
| POST | /api/items/:id/claim | Yes | Claim item (-1 token) |
| DELETE | /api/items/:id | Yes | Delete own item |
| GET | /api/users/:id | No | Get user profile |
| PUT | /api/users/me | Yes | Update own profile |
| GET | /api/transactions/me | Yes | Get token history |

## What to Implement Next

1. **Image uploads** - Add image picker on frontend, cloud storage (S3/Cloudinary) on backend
2. **Item detail screen** - Full item view with claim button
3. **Real-time inbox** - WebSocket or polling for claim notifications
4. **Pull-to-refresh & pagination** - On Explore and Search screens
5. **User profile pages** - View other users' profiles and listings
6. **Input validation** - Add express-validator on backend routes
7. **Error boundaries** - Add React error boundaries in the app
8. **Testing** - Jest for backend, React Native Testing Library for frontend
