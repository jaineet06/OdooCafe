import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "../api/sessions.api";
import { useAuth } from "./AuthContext";
import { useWsEvent } from "../context/WebSocketContext";
import { WS_EVENTS } from "../utils/constants";
import { setSessionClosedHandler } from "../api/axios";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [locked, setLocked] = useState(false);

  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ["session", "current"],
    queryFn: sessionsApi.current,
    enabled: isAuthenticated,
    retry: false,
  });

  const lockSession = useCallback(() => {
    setLocked(true);
    queryClient.setQueryData(["session", "current"], null);
  }, [queryClient]);

  useEffect(() => {
    setSessionClosedHandler(lockSession);
    return () => setSessionClosedHandler(null);
  }, [lockSession]);

  useWsEvent((type) => {
    if (type === WS_EVENTS.SESSION_CLOSED) {
      lockSession();
    }
  });

  useEffect(() => {
    if (session) setLocked(false);
  }, [session]);

  return (
    <SessionContext.Provider
      value={{
        session,
        isLoading,
        locked,
        lockSession,
        refreshSession: refetch,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
