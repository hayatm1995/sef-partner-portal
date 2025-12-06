import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { deliverablesService, partnerSubmissionsService } from "@/services/supabaseService";
import { useLocation } from "react-router-dom";

/**
 * Reusable hook to fetch and merge deliverables with their submissions for the current partner
 * @returns {Object} { data, isLoading, error }
 * 
 * Returns merged deliverables with submission data:
 * {
 *   id,
 *   title,
 *   due_date,
 *   is_required,
 *   submission_status: 'pending' | 'approved' | 'rejected' | null,
 *   submission_url,
 *   submitted_at
 * }
 */
export function usePartnerDeliverables() {
  const { user, partner } = useAuth();
  const location = useLocation();
  
  // Get current partner ID (handles admin view-as functionality)
  const urlParams = new URLSearchParams(location.search);
  const viewAsPartnerId = urlParams.get('viewAs');
  const currentPartnerId = viewAsPartnerId || partner?.id;

  // Fetch deliverables for the partner
  const { data: deliverables = [], isLoading: loadingDeliverables, error: deliverablesError } = useQuery({
    queryKey: ['partnerDeliverables', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return [];
      try {
        return await deliverablesService.getAll(currentPartnerId);
      } catch (error) {
        console.error('Error fetching deliverables:', error);
        return [];
      }
    },
    enabled: !!currentPartnerId,
  });

  // Fetch submissions for the partner
  const { data: submissions = [], isLoading: loadingSubmissions, error: submissionsError } = useQuery({
    queryKey: ['partnerSubmissions', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return [];
      try {
        return await partnerSubmissionsService.getByPartnerId(currentPartnerId);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        return [];
      }
    },
    enabled: !!currentPartnerId,
  });

  // Merge deliverables with submissions
  const mergedData = React.useMemo(() => {
    if (!deliverables || deliverables.length === 0) return [];

    // Create a map of deliverable_id -> latest submission
    const submissionsMap = {};
    if (Array.isArray(submissions)) {
      submissions.forEach(submission => {
        const deliverableId = submission.deliverable_id;
        // Keep only the latest submission per deliverable
        if (!submissionsMap[deliverableId] || 
            new Date(submission.created_at) > new Date(submissionsMap[deliverableId].created_at)) {
          submissionsMap[deliverableId] = submission;
        }
      });
    }

    // Merge deliverables with their submissions
    return deliverables.map(deliverable => {
      const submission = submissionsMap[deliverable.id] || null;
      
      return {
        id: deliverable.id,
        title: deliverable.name || deliverable.title || 'Untitled Deliverable',
        due_date: deliverable.due_date || null,
        is_required: deliverable.is_required !== false, // Default to true if not specified
        submission_status: submission?.status || null, // 'pending' | 'approved' | 'rejected' | null
        submission_url: submission?.file_url || null,
        submitted_at: submission?.created_at || null,
      };
    });
  }, [deliverables, submissions]);

  return {
    data: mergedData,
    isLoading: loadingDeliverables || loadingSubmissions,
    error: deliverablesError || submissionsError,
    partnerId: currentPartnerId,
  };
}

