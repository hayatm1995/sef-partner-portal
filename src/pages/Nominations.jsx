import React, { useState } from "react";
import { activityLogService } from "@/services/supabaseService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { nominationsService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Award, Users, Briefcase, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

import NominationForm from "../components/nominations/NominationForm";
import NominationCard from "../components/nominations/NominationCard";

export default function Nominations() {
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const queryClient = useQueryClient();
  const location = useLocation();
  const { user, partner } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.is_super_admin;

  // Get viewAs parameter for admin viewing as partner
  const urlParams = new URLSearchParams(location.search);
  const viewAsPartnerId = urlParams.get('viewAs');
  const currentPartnerId = viewAsPartnerId || partner?.id;

  const { role, partnerId } = useAuth();

  const { data: nominations = [], isLoading } = useQuery({
    queryKey: ['nominations', currentPartnerId, isAdmin, viewAsPartnerId, role, partnerId],
    queryFn: async () => {
      if (isAdmin && !viewAsPartnerId) {
        // Admin viewing all nominations (role-based filtering)
        return nominationsService.getAll({
          role: role || undefined,
          currentUserPartnerId: partnerId || undefined,
        });
      } else if (currentPartnerId) {
        // Partner viewing their own OR admin viewing as specific partner
        return nominationsService.getAll({ partnerId: currentPartnerId });
      }
      return [];
    },
    enabled: !!user && (isAdmin || !!currentPartnerId),
  });

  const createNominationMutation = useMutation({
    mutationFn: async (data) => {
      // nominationsService.create will automatically add partner_id, created_by, and status
      // But we can still pass partner_id if we have it (for admin viewing as partner)
      const nominationData = {
        ...data,
        partner_id: currentPartnerId || undefined, // Will be set by service if not provided
        category: data.type || data.category,
        status: 'pending', // Will be mapped to 'Submitted' by service
      };
      return nominationsService.create(nominationData);
    },
    onSuccess: async (newNomination) => {
      // Log the activity
      try {
        if (user?.partner_user?.id && user?.partner_id) {
          await activityLogService.create({
            activity_type: "nomination_submitted",
            user_id: user.partner_user.id,
            partner_id: user.partner_id,
            description: `Nomination submitted: "${newNomination.nominee_name}" (${newNomination.nomination_type})`,
            metadata: {
              nomination_id: newNomination.id,
              nomination_type: newNomination.nomination_type,
              nominee_name: newNomination.nominee_name
            }
          });
        }
      } catch (error) {
        console.error("Failed to log activity:", error);
      }

      queryClient.invalidateQueries({ queryKey: ['nominations'] });
      setShowForm(false);
      setSelectedType(null);
    },
  });

  const handleSubmit = async (formData) => {
    createNominationMutation.mutate({
      ...formData,
      partner_email: effectiveEmail,
      nomination_type: selectedType,
    });
  };

  const nominationTypes = [
    {
      type: "workshop",
      title: "Workshop",
      description: "Submit a workshop proposal",
      icon: Briefcase,
      gradient: "from-blue-500 to-blue-600"
    },
    {
      type: "speaker",
      title: "Speaker",
      description: "Nominate a speaker",
      icon: Users,
      gradient: "from-purple-500 to-purple-600"
    },
    {
      type: "startup",
      title: "Startup",
      description: "Nominate an innovative startup",
      icon: Trophy,
      gradient: "from-green-500 to-green-600"
    },
    {
      type: "award",
      title: "Award",
      description: "Submit award nomination",
      icon: Award,
      gradient: "from-orange-500 to-orange-600"
    }
  ];

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading nominations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nominations</h1>
          <p className="text-gray-600">
            {isAdmin && !viewAsEmail
              ? `All partner nominations (${nominations.length} total)`
              : 'Submit nominations for workshops, speakers, startups, and awards'}
          </p>
        </div>

        {!showForm ? (
          <>
            {/* Nomination Type Cards - Only for partners */}
            {(!isAdmin || viewAsEmail) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {nominationTypes.map((type) => (
                  <motion.div
                    key={type.type}
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-full"
                  >
                    <Card
                      className="cursor-pointer border-2 hover:border-orange-300 transition-all duration-300 hover:shadow-xl h-full flex flex-col"
                      onClick={() => {
                        setSelectedType(type.type);
                        setShowForm(true);
                      }}
                    >
                      <CardContent className="p-6 text-center flex flex-col items-center justify-between flex-1">
                        <div className="w-full">
                          <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${type.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                            <type.icon className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="font-bold text-lg mb-2">{type.title}</h3>
                          <p className="text-sm text-gray-600 mb-4 min-h-[40px]">{type.description}</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-auto">
                          <Plus className="w-4 h-4 mr-2" />
                          Submit
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Submitted Nominations */}
            <Card className="border-orange-100 shadow-md">
              <CardHeader>
                <CardTitle>
                  {isAdmin && !viewAsEmail ? 'All Partner Submissions' : 'Your Submissions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nominations.length > 0 ? (
                  <div className="space-y-4">
                    {nominations.map((nomination) => (
                      <NominationCard
                        key={nomination.id}
                        nomination={nomination}
                        isAdmin={isAdmin && !viewAsEmail}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No nominations yet</h3>
                    <p className="text-gray-600">
                      {isAdmin && !viewAsEmail
                        ? 'No partners have submitted nominations yet'
                        : 'Click on a category above to submit your first nomination'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <NominationForm
            type={selectedType}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setSelectedType(null);
            }}
            isLoading={createNominationMutation.isPending}
          />
        )}
      </motion.div>
    </div>
  );
}