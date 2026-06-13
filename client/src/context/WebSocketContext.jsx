import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5001";
const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const listenersRef = useRef(new Set());

  const subscribe = useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let ws;
    let reconnectTimer;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => ws.send(JSON.stringify({ type: "AUTH", token }));
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "AUTH_SUCCESS") return;
          listenersRef.current.forEach((fn) => fn(msg.type, msg.payload));
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        if (!closed) reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      ws?.close();
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
