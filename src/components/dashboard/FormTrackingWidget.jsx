import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function FormTrackingWidget({ formTracking }) {
  const getStatusIcon = (status) => {
    const icons = {
      submitted: <CheckCircle className="w-4 h-4 text-green-600" />,
      in_progress: <Clock className="w-4 h-4 text-yellow-600" />,
      not_started: <XCircle className="w-4 h-4 text-gray-400" />,
      approved: <CheckCircle className="w-4 h-4 text-green-600" />
    };
    return icons[status] || icons.not_started;
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      not_started: "bg-gray-100 text-gray-800",
      approved: "bg-green-100 text-green-800"
    };
    return colors[status] || colors.not_started;
  };

  const completionRate = formTracking.length > 0
    ? (formTracking.filter(f => f.status === 'submitted' || f.status === 'approved').length / formTracking.length) * 100
    : 0;

  return (
    <Card className="border-orange-100 shadow-md mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Form Submission Tracker</CardTitle>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {Math.round(completionRate)}% Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={completionRate} className="mb-6 h-2" />
        
        <div className="space-y-3">
          {formTracking.map((form) => (
            <div
              key={form.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(form.status)}
                <div>
                  <p className="font-medium">{form.form_name}</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {form.form_type.replace(/_/g, ' ')}
                  </p>
                  {form.deadline && (
                    <p className="text-xs text-gray-500">
                      Deadline: {format(new Date(form.deadline), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {form.is_required && (
                  <Badge variant="outline" className="bg-red-50 text-red-600 text-xs">
                    Required
                  </Badge>
                )}
                <Badge variant="outline" className={getStatusColor(form.status)}>
                  {form.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}