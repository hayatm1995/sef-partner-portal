import { supabase } from '@/config/supabase';

/**
 * Get a signed URL for a file in Supabase Storage
 * @param {string} filePath - Path to the file in storage (e.g., 'deliverables/partner_id/deliverable_id/filename')
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string|null>} Signed URL or null if error
 */
export const getSignedFileUrl = async (filePath, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from('deliverables')
      .createSignedUrl(filePath, expiresIn);
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    
    return data?.signedUrl || null;
  } catch (error) {
    console.error('Exception creating signed URL:', error);
    return null;
  }
};

/**
 * Upload a file to Supabase Storage with RLS compliance
 * Ensures partner_id comes from context, not client input
 * @param {string} partnerId - Partner ID from auth context (required)
 * @param {string} deliverableId - Deliverable ID
 * @param {File} file - File to upload
 * @returns {Promise<{filePath: string, publicUrl: string, signedUrl: string|null}>}
 */
export const uploadDeliverableFile = async (partnerId, deliverableId, file) => {
  if (!partnerId || !deliverableId || !file) {
    throw new Error('Missing required parameters: partnerId, deliverableId, and file are required');
  }

  // Generate unique filename
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
  const filePath = `deliverables/${partnerId}/${deliverableId}/${uniqueFileName}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('deliverables')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Get signed URL for secure access
  const signedUrl = await getSignedFileUrl(filePath, 3600);

  // Also get public URL as fallback (if bucket is public)
  const { data: publicUrlData } = supabase.storage
    .from('deliverables')
    .getPublicUrl(filePath);

  return {
    filePath,
    publicUrl: publicUrlData?.publicUrl || null,
    signedUrl: signedUrl || null,
  };
};


