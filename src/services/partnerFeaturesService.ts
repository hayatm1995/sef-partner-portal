/**
 * Partner Features Service
 * 
 * Manages partner feature visibility controls.
 * Features control which sections appear in the PartnerHub.
 */

import { supabase } from '@/config/supabase';

export interface PartnerFeature {
  id: string;
  partner_id: string;
  feature: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Default feature list (9 features as per requirements)
 */
export const DEFAULT_FEATURES = [
  'Company Profile',
  'Deliverables',
  'Booth Options',
  'VIP Guest List',
  'Media Uploads',
  'Payments',
  'Legal & Branding',
  'Speaker Requests',
  'Nominations',
] as const;

export type FeatureName = typeof DEFAULT_FEATURES[number];

/**
 * Feature display names mapping (same as feature names since we use display names as keys)
 */
export const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  'Company Profile': 'Company Profile',
  'Deliverables': 'Deliverables',
  'Booth Options': 'Booth Options',
  'VIP Guest List': 'VIP Guest List',
  'Media Uploads': 'Media Uploads',
  'Payments': 'Payments',
  'Legal & Branding': 'Legal & Branding',
  'Speaker Requests': 'Speaker Requests',
  'Nominations': 'Nominations',
};

export const partnerFeaturesService = {
  /**
   * Get all features for a partner
   * @param partnerId - Partner ID
   * @returns Array of partner features
   */
  async getByPartnerId(partnerId: string): Promise<PartnerFeature[]> {
    const { data, error } = await supabase
      .from('partner_features')
      .select('*')
      .eq('partner_id', partnerId)
      .order('feature', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get enabled features for a partner (as array of feature names)
   * @param partnerId - Partner ID
   * @returns Array of enabled feature names
   */
  async getEnabledFeatures(partnerId: string): Promise<string[]> {
    const features = await this.getByPartnerId(partnerId);
    return features.filter(f => f.enabled).map(f => f.feature);
  },

  /**
   * Check if a specific feature is enabled for a partner
   * @param partnerId - Partner ID
   * @param feature - Feature name
   * @returns True if enabled, false otherwise
   */
  async isFeatureEnabled(partnerId: string, feature: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('partner_features')
      .select('enabled')
      .eq('partner_id', partnerId)
      .eq('feature', feature)
      .single();

    if (error) {
      // If feature doesn't exist, default to enabled (backward compatibility)
      if (error.code === 'PGRST116') {
        return true;
      }
      throw error;
    }

    return data?.enabled ?? true;
  },

  /**
   * Update a single feature's enabled status
   * @param partnerId - Partner ID
   * @param feature - Feature name
   * @param enabled - Whether feature is enabled
   */
  async updateFeature(partnerId: string, feature: string, enabled: boolean): Promise<PartnerFeature> {
    // Use upsert to create if doesn't exist, update if exists
    const { data, error } = await supabase
      .from('partner_features')
      .upsert({
        partner_id: partnerId,
        feature,
        enabled,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'partner_id,feature',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Bulk update multiple features for a partner
   * @param partnerId - Partner ID
   * @param features - Object mapping feature names to enabled status
   */
  async bulkUpdate(partnerId: string, features: Record<string, boolean>): Promise<PartnerFeature[]> {
    const updates = Object.entries(features).map(([feature, enabled]) => ({
      partner_id: partnerId,
      feature,
      enabled,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('partner_features')
      .upsert(updates, {
        onConflict: 'partner_id,feature',
      })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Initialize default features for a partner (all enabled)
   * Called when a new partner is created
   * @param partnerId - Partner ID
   */
  async initializeDefaultFeatures(partnerId: string): Promise<PartnerFeature[]> {
    const features = DEFAULT_FEATURES.map(feature => ({
      partner_id: partnerId,
      feature,
      enabled: true,
    }));

    const { data, error } = await supabase
      .from('partner_features')
      .insert(features)
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Get default feature list
   * @returns Array of default feature names
   */
  getDefaultFeatures(): readonly string[] {
    return DEFAULT_FEATURES;
  },

  /**
   * Get feature display name
   * @param feature - Feature name
   * @returns Display name or feature name if not found
   */
  getFeatureDisplayName(feature: string): string {
    return FEATURE_DISPLAY_NAMES[feature as FeatureName] || feature;
  },
};

