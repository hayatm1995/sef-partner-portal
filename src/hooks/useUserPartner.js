import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import { partnersService } from "@/services/supabaseService";

/**
 * Hook to fetch user partner context from v_user_partner_context view
 * Returns partner_id, partner_role, partner_name
 * In dev mode, defaults to Demo Partner if no real partner found
 */
export function useUserPartner(authUserId) {
  const isDevMode = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return useQuery({
    queryKey: ['userPartnerContext', authUserId],
    queryFn: async () => {
      if (!authUserId) {
        return null;
      }

      try {
        // Query the v_user_partner_context view
        const { data, error } = await supabase
          .from('v_user_partner_context')
          .select('*')
          .eq('auth_user_id', authUserId)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = not found, which is OK
          console.error('Error fetching user partner context:', error);
          throw error;
        }

        // If found, return the context
        if (data) {
          console.log('✅ Found user partner context:', data);
          return {
            partner_id: data.partner_id,
            partner_role: data.partner_role,
            partner_name: data.partner_name,
            partner_tier: data.partner_tier,
            contract_status: data.contract_status,
            full_name: data.full_name,
            partner_user_id: data.partner_user_id,
            partner_user_email: data.partner_user_email,
          };
        }

        // If not found and in dev mode, default to Demo Partner
        if (isDevMode) {
          console.log('⚠️ No partner context found, defaulting to Demo Partner (dev mode)');
          try {
            const partners = await partnersService.getAll();
            const demoPartner = partners.find(p => p.name === 'Demo Partner') || partners[0];
            
            if (demoPartner) {
              return {
                partner_id: demoPartner.id,
                partner_role: 'admin', // Default role for dev mode
                partner_name: demoPartner.name,
                partner_tier: demoPartner.tier,
                contract_status: demoPartner.contract_status,
                full_name: 'Demo User',
                partner_user_id: null,
                partner_user_email: null,
              };
            }
          } catch (error) {
            console.warn('Could not fetch Demo Partner:', error);
          }
        }

        return null;
      } catch (error) {
        console.error('Error in useUserPartner:', error);
        
        // In dev mode, still try to return Demo Partner
        if (isDevMode) {
          try {
            const partners = await partnersService.getAll();
            const demoPartner = partners.find(p => p.name === 'Demo Partner') || partners[0];
            
            if (demoPartner) {
              return {
                partner_id: demoPartner.id,
                partner_role: 'admin',
                partner_name: demoPartner.name,
                partner_tier: demoPartner.tier,
                contract_status: demoPartner.contract_status,
                full_name: 'Demo User',
                partner_user_id: null,
                partner_user_email: null,
              };
            }
          } catch (err) {
            console.warn('Could not fetch Demo Partner as fallback:', err);
          }
        }
        
        return null;
      }
    },
    enabled: !!authUserId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}


