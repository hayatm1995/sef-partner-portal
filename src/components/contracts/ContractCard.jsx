import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, Send, Eye, XCircle, Archive } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700 border-gray-300", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700 border-blue-300", icon: Send },
  under_review: { label: "Under Review", color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: Eye },
  signed: { label: "Signed", color: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-300", icon: XCircle },
  archived: { label: "Archived", color: "bg-slate-100 text-slate-700 border-slate-300", icon: Archive }
};

export default function ContractCard({ contract, isSelected, onClick, showPartner, partnerName }) {
  const status = statusConfig[contract.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`cursor-pointer transition-all duration-300 border-2 ${
          isSelected 
            ? 'border-orange-500 bg-orange-50 shadow-lg' 
            : 'border-transparent hover:border-orange-200 hover:shadow-md'
        }`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isSelected ? 'bg-orange-500' : 'bg-gradient-to-br from-orange-400 to-amber-500'
            }`}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{contract.title}</h4>
              {showPartner && partnerName && (
                <p className="text-xs text-gray-500 truncate">{partnerName}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={`${status.color} text-xs flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </Badge>
                <span className="text-xs text-gray-400">v{contract.version || "1.0"}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(contract.created_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}