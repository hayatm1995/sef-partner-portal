import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Shield, Bell } from "lucide-react";
import { format } from "date-fns";

export default function StatusOverview({ user, deliverables, nominations, updates }) {
  const getBadgeColor = (level) => {
    const colors = {
      platinum: "bg-gradient-to-r from-gray-400 to-gray-600 text-white",
      gold: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white",
      silver: "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900",
      bronze: "bg-gradient-to-r from-orange-400 to-orange-600 text-white"
    };
    return colors[level] || "bg-gray-400";
  };

  const getContractStatusIcon = (status) => {
    const icons = {
      signed: <CheckCircle className="w-5 h-5 text-green-500" />,
      pending: <Clock className="w-5 h-5 text-yellow-500" />,
      expired: <AlertCircle className="w-5 h-5 text-red-500" />
    };
    return icons[status] || <Clock className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Partner Status Card */}
      <Card className="border-orange-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Your Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.badge_level && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Partnership Level</p>
              <Badge className={`${getBadgeColor(user.badge_level)} text-sm px-3 py-1`}>
                {user.badge_level?.toUpperCase()} PARTNER
              </Badge>
            </div>
          )}

          {user?.contract_status && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Contract Status</p>
              <div className="flex items-center gap-2">
                {getContractStatusIcon(user.contract_status)}
                <span className="font-medium capitalize">{user.contract_status}</span>
              </div>
            </div>
          )}

          {user?.vip_box_assigned && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-900">VIP Box Assigned</span>
              </div>
              <p className="text-sm text-purple-700">You have exclusive VIP access</p>
            </div>
          )}

          {user?.account_manager && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Account Manager</p>
              <p className="font-medium">{user.account_manager}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications Card */}
      {updates.length > 0 && (
        <Card className="border-amber-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {updates.slice(0, 3).map((update) => (
                <div
                  key={update.id}
                  className="p-3 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <p className="font-medium text-sm mb-1">{update.title}</p>
                  <p className="text-xs text-gray-600">{update.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(update.created_date), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Card className="border-orange-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Deliverables</span>
            <span className="font-bold text-lg">{deliverables.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Active Nominations</span>
            <span className="font-bold text-lg">{nominations.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Pending Review</span>
            <span className="font-bold text-lg text-orange-600">
              {deliverables.filter(d => d.status === 'pending_review').length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}