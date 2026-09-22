import { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, setAuthToken } from "./api";

const STORAGE_KEY = "txt2cart:auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [phone, setPhone] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setAuthToken(saved.token);
          setToken(saved.token);
          setPhone(saved.phone);
        }
      } catch (err) {
        // corrupt/missing storage -- just start logged out
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (nextPhone, nextToken) => {
    setAuthToken(nextToken);
    setToken(nextToken);
    setPhone(nextPhone);
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ phone: nextPhone, token: nextToken })
    );
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setPhone(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ phone, token, loading, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
