import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

let io: Server;

export function setupSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.use((socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("No token provided"));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "dev-secret"
      ) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    socket.join(userId);
    console.log(`User ${userId} connected to socket`);

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected from socket`);
    });
  });

  console.log("Socket.io attached");
  return io;
}

export function getIO(): Server {
  return io;
}
