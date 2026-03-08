import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../hooks/useAuth";
import { API_URL } from "../constants/Config";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export function useSocket() {
  return useContext(SocketContext).socket;
}

// Derive the base URL (strip /api) for socket connection
const SOCKET_URL = API_URL.replace(/\/api$/, "");

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    let active = true;

    (async () => {
      const token = await SecureStore.getItemAsync("auth_token");
      if (!token || !active) return;

      const s = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      s.on("connect", () => {
        console.log("Socket connected");
      });

      s.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      if (active) {
        setSocket(s);
      } else {
        s.disconnect();
      }
    })();

    return () => {
      active = false;
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}
