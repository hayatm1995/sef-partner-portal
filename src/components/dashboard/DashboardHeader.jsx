import React from "react";
import { Sparkles } from "lucide-react";

export default function DashboardHeader({ user }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Partner'}!
        </h1>
        <Sparkles className="w-6 h-6 text-amber-500" />
      </div>
      {user?.company_name && (
        <p className="text-lg text-gray-600">{user.company_name}</p>
      )}
      {user?.account_manager && (
        <p className="text-sm text-gray-500 mt-1">
          Account Manager: <span className="font-medium">{user.account_manager}</span>
        </p>
      )}
    </div>
  );
}