import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Clock, AlertCircle, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Tasks() {
  const [activeTab, setActiveTab] = useState("active");
  const queryClient = useQueryClient();
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.is_super_admin;

  const urlParams = new URLSearchParams(location.search);
  const viewAsEmail = urlParams.get('viewAs');
  const effectiveEmail = viewAsEmail || user?.email;

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders', effectiveEmail],
    queryFn: async () => {
      if (isAdmin && !viewAsEmail) {
        return base44.entities.Reminder.list('-due_date');
      }
      return base44.entities.Reminder.filter({ partner_email: effectiveEmail }, '-due_date');
    },
    enabled: !!user,
  });

  const dismissReminderMutation = useMutation({
    mutationFn: (id) => base44.entities.Reminder.update(id, { is_dismissed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const activeReminders = reminders.filter(r => !r.is_dismissed);
  const dismissedReminders = reminders.filter(r => r.is_dismissed);

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent' || priority === 'high') {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <Clock className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tasks & Reminders</h1>
          <p className="text-gray-600">
            {isAdmin && !viewAsEmail 
              ? 'View all partner tasks and reminders'
              : 'Stay on top of deadlines and requirements'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Tasks</p>
                  <p className="text-3xl font-bold text-orange-600">{activeReminders.length}</p>
                </div>
                <CheckSquare className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Priority</p>
                  <p className="text-3xl font-bold text-red-600">
                    {activeReminders.filter(r => r.priority === 'urgent' || r.priority === 'high').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{dismissedReminders.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <Card className="border-orange-100 shadow-md">
          <CardHeader>
            <CardTitle>
              {isAdmin && !viewAsEmail ? 'All Partner Tasks' : 'Your Tasks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="active">
                  Active ({activeReminders.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({dismissedReminders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                {activeReminders.length > 0 ? (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {activeReminders.map((reminder) => (
                        <motion.div
                          key={reminder.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          className="p-4 border-2 rounded-lg hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className={`${getPriorityColor(reminder.priority)} border flex items-center gap-1`}>
                                  {getPriorityIcon(reminder.priority)}
                                  {reminder.priority}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {reminder.reminder_type.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                              <h3 className="font-bold text-lg mb-2">{reminder.title}</h3>
                              <p className="text-sm text-gray-600 mb-3">{reminder.message}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Due: {format(new Date(reminder.due_date), 'MMM d, yyyy')}
                                </span>
                                {isAdmin && !viewAsEmail && (
                                  <span className="text-blue-600">
                                    Partner: {reminder.partner_email}
                                  </span>
                                )}
                              </div>
                            </div>
                            {(!isAdmin || viewAsEmail) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => dismissReminderMutation.mutate(reminder.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-600">
                      {isAdmin && !viewAsEmail 
                        ? 'No active tasks from partners'
                        : 'You have no active tasks at the moment'}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed">
                {dismissedReminders.length > 0 ? (
                  <div className="space-y-4">
                    {dismissedReminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="p-4 border rounded-lg bg-gray-50 opacity-75"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-gray-900">{reminder.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{reminder.message}</p>
                        {isAdmin && !viewAsEmail && (
                          <p className="text-xs text-blue-600 mt-2">
                            Partner: {reminder.partner_email}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed tasks</h3>
                    <p className="text-gray-600">Completed tasks will appear here</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}