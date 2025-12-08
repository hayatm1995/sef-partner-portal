import { useAuth } from "@/contexts/AuthContext";
import { useDevRole, DevAppRole } from "@/contexts/DevRoleContext";
import { useRoleSelection } from "@/contexts/RoleSelectionContext";
import { DEV_MODE } from "@/config/devMode";

/**
 * Centralized hook for getting the current user's role
 * 
 * Priority order:
 * 1. RoleSelectionContext (from landing page selection)
 * 2. DevRoleContext (if DEV_MODE enabled)
 * 3. AuthContext (production auth)
 * 
 * @returns Object with role and partnerId
 */
export type AppRole = "superadmin" | "admin" | "partner" | "unknown";

export const useAppRole = (): { role: AppRole; partnerId: number | null } => {
  // Try to get role from role selection context first (landing page selection)
  let selectedRole: AppRole | null = null;
  let selectedPartnerId: number | null = null;
  try {
    const { selectedRole: role, selectedPartnerId: partnerId } = useRoleSelection();
    selectedRole = role as AppRole | null;
    selectedPartnerId = partnerId;
  } catch {
    // RoleSelectionContext not available, continue
  }

  const { role: devRole, partnerId: devPartnerId } = useDevRole();
  const { role: authRole, partnerId: authPartnerId, isSuperadmin } = useAuth();

  // Priority 1: Role selection from landing page
  if (selectedRole) {
    return {
      role: selectedRole,
      partnerId: selectedPartnerId, // Use selected partner ID from landing page
    };
  }

  // Priority 2: Dev Mode
  if (DEV_MODE) {
    return {
      role: (devRole as AppRole) || "unknown",
      partnerId: devPartnerId,
    };
  }

  // Priority 3: Production auth
  if (isSuperadmin) return { role: "superadmin", partnerId: authPartnerId || null };
  if (authRole === "admin") return { role: "admin", partnerId: authPartnerId || null };
  if (authRole === "partner") return { role: "partner", partnerId: authPartnerId || null };
  return { role: "unknown", partnerId: null };
};

