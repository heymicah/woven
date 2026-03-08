import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { messagesService } from "../services/messages.service";
import { useSocket } from "./SocketContext";

interface UnreadContextType {
    unreadCount: number;
    setUnreadCount: (count: number) => void;
    refresh: () => void;
}

const UnreadContext = createContext<UnreadContextType>({
    unreadCount: 0,
    setUnreadCount: () => { },
    refresh: () => { },
});

export function UnreadProvider({ children }: { children: React.ReactNode }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const socket = useSocket();

    const refresh = useCallback(async () => {
        try {
            const count = await messagesService.getUnreadCount();
            setUnreadCount(count);
        } catch {
            // silently fail
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Poll every 5 seconds so the badge updates without relying on WebSocket
    useEffect(() => {
        const interval = setInterval(() => refresh(), 5000);
        return () => clearInterval(interval);
    }, [refresh]);

    // Also update via socket when available
    useEffect(() => {
        if (!socket) return;
        const handler = () => {
            setUnreadCount(prev => prev + 1);
        };
        socket.on("newMessage", handler);
        return () => {
            socket.off("newMessage", handler);
        };
    }, [socket]);

    return (
        <UnreadContext.Provider value={{ unreadCount, setUnreadCount, refresh }}>
            {children}
        </UnreadContext.Provider>
    );
}

export function useUnread() {
    return useContext(UnreadContext);
}
