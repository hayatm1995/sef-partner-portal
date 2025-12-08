import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type DemoRole = "superadmin" | "admin" | "partner" | "none";

type DemoState = {
  role: DemoRole;
  partnerId: string | null;
  setRole: (role: DemoRole) => void;
  setPartnerId: (id: string | null) => void;
};

const DemoContext = createContext<DemoState | undefined>(undefined);

const STORAGE_KEY = "sef_demo_state_v1";

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<DemoRole>("none");
  const [partnerId, setPartnerIdState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.role) setRoleState(parsed.role);
        if (parsed.partnerId) setPartnerIdState(parsed.partnerId);
      }
    } catch (e) {
      console.warn("Failed to restore demo state", e);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ role, partnerId }));
    } catch (e) {
      console.warn("Failed to persist demo state", e);
    }
  }, [role, partnerId]);

  const setRole = (newRole: DemoRole) => {
    setRoleState(newRole);
    if (newRole !== "partner") {
      setPartnerIdState(null);
    }
  };

  const setPartnerId = (id: string | null) => {
    setPartnerIdState(id);
  };

  return (
    <DemoContext.Provider value={{ role, partnerId, setRole, setPartnerId }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return ctx;
};

