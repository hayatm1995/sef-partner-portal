import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, UserCircle } from 'lucide-react';

export default function NoPartnerProfileFound({ userEmail }) {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md border-orange-200 shadow-xl">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Partner Profile Not Found</h2>
          <p className="text-gray-600 mb-6">
            No partner profile found. Please contact the SEF team to set up your partner account.
          </p>
          {userEmail && (
            <p className="text-sm text-gray-500">
              Email: {userEmail}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

