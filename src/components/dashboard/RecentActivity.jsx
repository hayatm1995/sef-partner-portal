import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Award, Clock } from "lucide-react";
import { format } from "date-fns";

export default function RecentActivity({ deliverables = [], nominations = [] }) {
  const getStatusColor = (status) => {
    const colors = {
      pending_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      revision_needed: "bg-orange-100 text-orange-800",
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-purple-100 text-purple-800",
      declined: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Combine and sort recent items
  const recentItems = [
    ...deliverables.slice(0, 5).map(d => ({ ...d, type: 'deliverable' })),
    ...nominations.slice(0, 5).map(n => ({ ...n, type: 'nomination' }))
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10);

  return (
    <Card className="border-green-100 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No recent activity</p>
          ) : (
            <>
              {recentItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors">
                  {item.type === 'deliverable' ? (
                    <FileText className="w-5 h-5 text-green-500 mt-1" />
                  ) : (
                    <Award className="w-5 h-5 text-emerald-500 mt-1" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {item.type === 'deliverable' ? item.title : item.nominee_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.type === 'deliverable' 
                        ? item.type?.replace(/_/g, ' ') 
                        : item.nomination_type}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(item.created_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(item.status)}>
                    {item.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}