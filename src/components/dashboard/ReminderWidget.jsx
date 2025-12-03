import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, ChevronRight } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ReminderWidget({ reminders }) {
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-blue-100 text-blue-800 border-blue-200"
    };
    return colors[priority] || colors.medium;
  };

  const getDaysUntilDue = (dueDate) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-6"
    >
      <Card className="border-amber-200 bg-amber-50 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Active Reminders ({reminders.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reminders.slice(0, 3).map((reminder) => {
              const daysLeft = getDaysUntilDue(reminder.due_date);
              return (
                <div
                  key={reminder.id}
                  className="p-4 bg-white rounded-lg border border-amber-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getPriorityColor(reminder.priority)}>
                          {reminder.priority}
                        </Badge>
                        {daysLeft <= 3 && (
                          <Badge variant="outline" className="bg-red-50 text-red-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {daysLeft} days left
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1">{reminder.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{reminder.message}</p>
                      <p className="text-xs text-gray-500">
                        Due: {format(new Date(reminder.due_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    {reminder.action_url && (
                      <Link to={reminder.action_url}>
                        <Button size="sm" variant="outline">
                          Action <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}