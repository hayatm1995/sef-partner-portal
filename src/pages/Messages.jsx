import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import PartnerMessages from "@/components/messaging/PartnerMessages";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Messages() {
  const { partner } = useAuth();
  const partnerId = partner?.id;

  if (!partnerId) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500">Partner profile not found. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
            <p className="text-gray-600">Chat securely with the SEF admin team</p>
          </div>
          {partner?.name && (
            <Badge variant="outline" className="text-sm">
              {partner.name}
            </Badge>
          )}
        </div>
        <PartnerMessages partnerId={partnerId} />
      </motion.div>
    </div>
  );
}