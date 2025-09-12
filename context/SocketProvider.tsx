"use client";

import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useRef,
  useContext,
} from "react";
import { io, Socket } from "socket.io-client";

interface ISocketProvider {
  children?: ReactNode;
}

interface ISocketContext {
  sendMessage: (msg: any) => void;
  socket: Socket | null;
  connectWithSocket: (token: string) => void;
  disconnectWithSocket: () => void;
}

const SocketContext = createContext<ISocketContext | null>(null);

export const SocketProvider: FC<ISocketProvider> = ({ children }) => {
  const socketRef = useRef<Socket | null>(
    io("http://localhost:8000", {
      path: "/sockets",
      transports: ["websocket"],
      autoConnect: false,
    })
  );

  const connectWithSocket = (token: string) => {
    if (!socketRef.current) return;

    socketRef.current.auth = { token };
    socketRef.current.connect();

    socketRef.current.on("connect", () => {
      console.log("SocketConnected: ", socketRef.current?.id);
    });
  };

  const disconnectWithSocket = () => {
    if (!socketRef.current) return;

    socketRef.current.disconnect();
    console.log("SocketDisconnected: ", socketRef.current?.id);
  };

  const sendMessage = useCallback((messagePayload: any) => {
    if (!socketRef.current) return;
    socketRef.current.emit("chat_message", messagePayload);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        sendMessage,
        socket: socketRef.current,
        connectWithSocket,
        disconnectWithSocket,
      }}
    >
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
