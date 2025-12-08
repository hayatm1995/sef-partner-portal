/**
 * Dev Mode Configuration
 * 
 * Set VITE_SEF_PARTNER_HUB_DEV_MODE=true in .env to enable dev mode
 * In dev mode, authentication is bypassed and role/partner selection is done via UI
 */
export const DEV_MODE = import.meta.env.VITE_SEF_PARTNER_HUB_DEV_MODE === "true";

