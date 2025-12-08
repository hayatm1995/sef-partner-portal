import React, { createContext, useContext, useState, ReactNode } from "react";

export type SelectedRole = "superadmin" | "admin" | "partner" | null;

type RoleSelectionState = {
  selectedRole: SelectedRole;
  selectedPartnerId: number | null;
  setSelectedRole: (role: SelectedRole) => void;
  setSelectedPartnerId: (id: number | null) => void;
};

const RoleSelectionContext = createContext<RoleSelectionState | undefined>(undefined);

export const RoleSelectionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);

  return (
    <RoleSelectionContext.Provider value={{ 
      selectedRole, 
      selectedPartnerId,
      setSelectedRole, 
      setSelectedPartnerId 
    }}>
      {children}
    </RoleSelectionContext.Provider>
  );
};

export const useRoleSelection = () => {
  const ctx = useContext(RoleSelectionContext);
  if (!ctx) {
    throw new Error("useRoleSelection must be used within RoleSelectionProvider");
  }
  return ctx;
};

