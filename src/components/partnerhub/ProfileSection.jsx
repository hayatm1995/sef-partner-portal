import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Building, DollarSign } from "lucide-react";

export default function ProfileSection({ user, profile, isAdmin }) {
  if (!profile) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Profile not yet configured. Please contact your account manager.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-orange-100">
        <CardHeader>
          <CardTitle>Partnership Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Partner Name</p>
              </div>
              <p className="text-lg font-semibold">{user?.full_name}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Company</p>
              </div>
              <p className="text-lg font-semibold">{user?.company_name || 'N/A'}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Email</p>
              </div>
              <p className="font-medium">{user?.email}</p>
            </div>

            {profile.package_tier && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-2">Package/Tier</p>
                <p className="font-semibold">{profile.package_tier}</p>
              </div>
            )}

            {isAdmin && profile.allocated_amount && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-600">Allocated Amount</p>
                </div>
                <p className="text-lg font-semibold">${profile.allocated_amount.toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100 bg-blue-50">
        <CardHeader>
          <CardTitle>Your Account Manager</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <p className="font-semibold text-lg">{profile.account_manager_name}</p>
          </div>
          {profile.account_manager_email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <a href={`mailto:${profile.account_manager_email}`} className="text-blue-700 hover:underline">
                {profile.account_manager_email}
              </a>
            </div>
          )}
          {profile.account_manager_phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              <a href={`tel:${profile.account_manager_phone}`} className="text-blue-700 hover:underline">
                {profile.account_manager_phone}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && profile.admin_notes && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle>Admin Notes (Internal Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{profile.admin_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}