import { useEffect, useRef, useCallback } from "react";
import { WS_EVENTS } from "../utils/constants";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5001";

export function useWebSocket(token, onEvent) {
  const wsRef = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!token) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "AUTH", token }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "AUTH_SUCCESS") return;
        onEventRef.current?.(msg.type, msg.payload);
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      setTimeout(connect, 3000);
    };
  }, [token]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return wsRef;
}

export { WS_EVENTS };
