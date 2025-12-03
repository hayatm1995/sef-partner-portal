import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function MediaUsageCard({ usage }) {
  const getPlatformColor = (platform) => {
    const colors = {
      facebook: "bg-blue-100 text-blue-800",
      instagram: "bg-pink-100 text-pink-800",
      twitter: "bg-sky-100 text-sky-800",
      linkedin: "bg-indigo-100 text-indigo-800",
      website: "bg-green-100 text-green-800",
      radio: "bg-purple-100 text-purple-800",
      tv: "bg-red-100 text-red-800",
      print: "bg-gray-100 text-gray-800",
      email: "bg-orange-100 text-orange-800"
    };
    return colors[platform] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="border-orange-100 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Badge variant="outline" className={`${getPlatformColor(usage.platform)} mb-2`}>
              {usage.platform}
            </Badge>
            <h3 className="font-semibold">{usage.campaign_name}</h3>
            <p className="text-sm text-gray-600">
              {format(new Date(usage.usage_date), 'MMM d, yyyy')}
            </p>
          </div>
          {usage.reach && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600 font-semibold">
                <TrendingUp className="w-4 h-4" />
                {usage.reach.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">reach</p>
            </div>
          )}
        </div>

        {usage.notes && (
          <p className="text-sm text-gray-700 mb-3">{usage.notes}</p>
        )}

        {usage.post_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(usage.post_url, '_blank')}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Post
          </Button>
        )}
      </CardContent>
    </Card>
  );
}