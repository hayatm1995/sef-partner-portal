import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";

export default function CompletionStats({ partners, formTracking }) {
  const formTypes = ['workshop_nomination', 'speaker_nomination', 'startup_nomination', 'award_nomination'];
  
  const getCompletionRate = (formType) => {
    const totalPartners = partners.filter(p => p.role === 'user').length;
    const completed = formTracking.filter(f => 
      f.form_type === formType && 
      (f.status === 'submitted' || f.status === 'approved')
    ).length;
    
    return totalPartners > 0 ? (completed / totalPartners) * 100 : 0;
  };

  const stats = formTypes.map(type => ({
    name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    rate: getCompletionRate(type)
  }));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {stats.map((stat) => (
        <Card key={stat.name} className="border-orange-100 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              {stat.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{Math.round(stat.rate)}%</span>
                <span className="text-sm text-gray-600">completion rate</span>
              </div>
              <Progress value={stat.rate} className="h-3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}