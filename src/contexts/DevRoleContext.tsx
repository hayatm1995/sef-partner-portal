import React, { createContext, useContext, useState, ReactNode } from "react";
import { DEV_MODE } from "../config/devMode";

export type DevAppRole = "superadmin" | "admin" | "partner" | "unknown";

type DevRoleState = {
  role: DevAppRole;
  partnerId: number | null;
  setRole: (role: DevAppRole) => void;
  setPartnerId: (id: number | null) => void;
};

const DevRoleContext = createContext<DevRoleState | undefined>(undefined);

export const DevRoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<DevAppRole>("unknown");
  const [partnerId, setPartnerId] = useState<number | null>(null);

  // In production mode, this context should basically be a no-op wrapper.
  if (!DEV_MODE) {
    return <>{children}</>;
  }

  return (
    <DevRoleContext.Provider value={{ role, partnerId, setRole, setPartnerId }}>
      {children}
    </DevRoleContext.Provider>
  );
};

export const useDevRole = () => {
  const ctx = useContext(DevRoleContext);
  if (!DEV_MODE) {
    return {
      role: "unknown" as DevAppRole,
      partnerId: null as number | null,
      setRole: () => {},
      setPartnerId: () => {},
    };
  }
  if (!ctx) throw new Error("useDevRole must be used within DevRoleProvider");
  return ctx;
};

