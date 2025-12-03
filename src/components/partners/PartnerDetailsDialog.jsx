import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, User, Shield, Award } from "lucide-react";

export default function PartnerDetailsDialog({ partner, onClose }) {
  const getBadgeColor = (level) => {
    const colors = {
      platinum: "bg-gray-400 text-white",
      gold: "bg-yellow-400 text-gray-900",
      silver: "bg-gray-300 text-gray-900",
      bronze: "bg-orange-400 text-white"
    };
    return colors[level] || "bg-gray-200";
  };

  const getStatusColor = (status) => {
    const colors = {
      signed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      expired: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Partner Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">
                {partner.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{partner.full_name}</h3>
              {partner.company_name && (
                <p className="text-lg text-gray-600">{partner.company_name}</p>
              )}
              <Badge className="mt-2" variant="outline">
                {partner.role === 'admin' ? 'Administrator' : 'Partner'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Email</p>
              </div>
              <p className="font-medium">{partner.email}</p>
            </div>

            {partner.phone && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                </div>
                <p className="font-medium">{partner.phone}</p>
              </div>
            )}

            {partner.account_manager && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-600">Account Manager</p>
                </div>
                <p className="font-medium">{partner.account_manager}</p>
              </div>
            )}

            {partner.badge_level && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-600">Badge Level</p>
                </div>
                <Badge className={getBadgeColor(partner.badge_level)}>
                  {partner.badge_level?.toUpperCase()}
                </Badge>
              </div>
            )}

            {partner.contract_status && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-600">Contract Status</p>
                </div>
                <Badge variant="outline" className={getStatusColor(partner.contract_status)}>
                  {partner.contract_status}
                </Badge>
              </div>
            )}

            {partner.vip_box_assigned !== undefined && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-2">VIP Box</p>
                <Badge className={partner.vip_box_assigned ? "bg-purple-500 text-white" : "bg-gray-300"}>
                  {partner.vip_box_assigned ? 'Assigned' : 'Not Assigned'}
                </Badge>
              </div>
            )}
          </div>

          {partner.notes && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Admin Notes</p>
              <p className="text-gray-700">{partner.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}