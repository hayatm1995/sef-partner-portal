import { supabase } from "@/config/supabase";

export interface Deliverable {
  id: string;
  key: string;
  title: string;
  status: "pending" | "submitted" | "approved" | "rejected";
  admin_notes?: string;
  file_url?: string;
  partner_id: string;
  submitted_at?: string;
  reviewed_at?: string;
  partners?: {
    name: string;
  };
}

export const deliverablesService = {
  /**
   * Fetch deliverables for a specific partner
   */
  getPartnerDeliverables: async (partnerId: string) => {
    const { data, error } = await supabase
      .from("deliverables")
      .select("id, key, title, status, admin_notes, file_url, submitted_at, reviewed_at")
      .eq("partner_id", partnerId)
      .order("id", { ascending: true });

    if (error) throw error;
    return data as Deliverable[];
  },

  /**
   * Upload a file for a deliverable
   */
  uploadFile: async (partnerId: string, deliverableKey: string, file: File) => {
    const path = `${partnerId}/${deliverableKey}/${file.name}`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("deliverables")
      .upload(path, file, {
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get Public URL
    const { data } = supabase.storage.from("deliverables").getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Update deliverable record after upload
   */
  submitDeliverable: async (id: string, fileUrl: string) => {
    const { error } = await supabase
      .from("deliverables")
      .update({
        file_url: fileUrl,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Fetch all deliverables for admin review
   */
  getAllDeliverables: async () => {
    const { data, error } = await supabase
      .from("deliverables")
      .select(`
        *,
        partners (id, name)
      `)
      .order("submitted_at", { ascending: false });

    if (error) throw error;
    return data as Deliverable[];
  },

  /**
   * Approve a deliverable
   */
  approveDeliverable: async (id: string) => {
    const { error } = await supabase
      .from("deliverables")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Reject a deliverable
   */
  rejectDeliverable: async (id: string, reason: string) => {
    const { error } = await supabase
      .from("deliverables")
      .update({
        status: "rejected",
        admin_notes: reason,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  }
};

