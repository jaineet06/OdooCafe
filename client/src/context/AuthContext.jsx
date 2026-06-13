import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS, ROLES } from "../utils/constants";
import { setUnauthorizedHandler } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.TOKEN));
  const [kdsToken, setKdsToken] = useState(() => localStorage.getItem(STORAGE_KEYS.KDS_TOKEN));

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.KDS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.KDS_DEVICE);
    setToken(null);
    setUser(null);
    setKdsToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const login = (data) => {
    localStorage.removeItem(STORAGE_KEYS.KDS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.KDS_DEVICE);
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setKdsToken(null);
  };

  const signup = (data) => {
    localStorage.removeItem(STORAGE_KEYS.KDS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.KDS_DEVICE);
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setKdsToken(null);
  };

  const setKdsDeviceToken = (token, deviceMeta) => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.setItem(STORAGE_KEYS.KDS_TOKEN, token);
    if (deviceMeta) {
      localStorage.setItem(STORAGE_KEYS.KDS_DEVICE, JSON.stringify(deviceMeta));
    }
    setToken(null);
    setUser(null);
    setKdsToken(token);
  };

  const activeToken = kdsToken || token;
  const role = kdsToken ? ROLES.KDS_DEVICE : user?.role;
  const isAuthenticated = !!(token || kdsToken);

  return (
    <AuthContext.Provider
      value={{
        user,
        token: activeToken,
        role,
        isAuthenticated,
        isAdmin: role === ROLES.ADMIN,
        isEmployee: role === ROLES.EMPLOYEE,
        isKds: role === ROLES.KDS_DEVICE,
        login,
        signup,
        logout,
        setKdsDeviceToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
