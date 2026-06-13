import { useWsEvent } from "../context/WebSocketContext";
import { WS_EVENTS } from "../utils/constants";

/** @deprecated Use useWsEvent from WebSocketContext — kept for gradual migration */
export function useWebSocket(_token, onEvent) {
  useWsEvent(onEvent);
  return null;
}

export { WS_EVENTS };
