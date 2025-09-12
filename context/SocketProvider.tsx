"use client";

import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useContext,
} from "react";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

interface ISocketProvider {
  children?: ReactNode;
}

interface ISocketContext {
  sendMessage: (msg: any) => void;
  socket: Socket | null;
}

const SocketContext = createContext<ISocketContext | null>(null);

export const SocketProvider: FC<ISocketProvider> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const initSocket = async () => {
      const token = Cookies.get("token"); // 👈 read cookie
      console.log("Token:", token);

      socketRef.current = io("http://localhost:8000", {
        path: "/sockets",
        transports: ["websocket"],
        auth: { token }, // ✅ send token as part of the handshake
      });

      socketRef.current.on("connect", () => {
        console.log("✅ Connected:", socketRef.current?.id);
      });

      socketRef.current.on("disconnect", () => {
        console.log("❌ Disconnected");
      });
    };

    initSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const sendMessage = useCallback((messagePayload: any) => {
    if (!socketRef.current) return;
    socketRef.current.emit("chat_message", messagePayload);
  }, []);

  return (
    <SocketContext.Provider value={{ sendMessage, socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook for easier usage
export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};
