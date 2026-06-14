import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5001";
const SOCKET_URL = WS_URL.replace(/^ws/, "http");

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const listenersRef = useRef(new Set());
  const socketRef = useRef(null);

  const subscribe = useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    console.log("Initializing Socket.io client...");
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket.io connected successfully");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.io connection error:", err.message);
    });

    socket.onAny((eventType, payload) => {
      console.log(`Socket event received: ${eventType}`, payload);
      listenersRef.current.forEach((fn) => {
        try {
          fn(eventType, payload);
        } catch (err) {
          console.error("Error in socket event listener callback", err);
        }
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket.io disconnected:", reason);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, isAuthenticated]);

  return (
    <WebSocketContext.Provider value={{ subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWsEvent(handler) {
  const ctx = useContext(WebSocketContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe((type, payload) => handlerRef.current?.(type, payload));
  }, [ctx]);
}
