import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar as CalendarIcon, Plus, Clock, MapPin, Video, UserCircle, Mail, Phone, ExternalLink,
  CheckSquare, AlertCircle, CheckCircle, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";

import BookingDialog from "../components/calendar/BookingDialog";
import BookingCard from "../components/calendar/BookingCard";
import CreateReminderDialog from "../components/timeline/CreateReminderDialog";
import AdminDeadlineDialog from "../components/timeline/AdminDeadlineDialog";

export default function Timeline() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showDeadlineDialog, setShowDeadlineDialog] = useState(false);
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

  const { data: profile } = useQuery({
    queryKey: ['partnerProfile', effectiveEmail],
    queryFn: async () => {
      if (isAdmin && !viewAsEmail) return null;
      const profiles = await base44.entities.PartnerProfile.filter({ 
        partner_email: effectiveEmail 
      });
      return profiles[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const { data: reminders = [], isLoading: isLoadingReminders } = useQuery({
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

  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['bookings', effectiveEmail],
    queryFn: async () => {
      if (isAdmin && !viewAsEmail) {
        return base44.entities.CalendarBooking.list('-start_time');
      }
      return base44.entities.CalendarBooking.filter({ partner_email: effectiveEmail }, '-start_time');
    },
    enabled: !!user,
  });

  const createBookingMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarBooking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setShowBookingDialog(false);
    },
  });

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin && !viewAsEmail,
  });

  const createReminderMutation = useMutation({
    mutationFn: async (data) => {
      const targetPartners = data.sendToAll 
        ? allPartners.filter(p => p.role !== 'admin')
        : allPartners.filter(p => data.selectedPartners.includes(p.id));

      const reminders = targetPartners.map(partner => ({
        partner_email: partner.email,
        title: data.title,
        message: data.message,
        reminder_type: data.reminder_type,
        priority: data.priority,
        due_date: data.due_date,
        is_dismissed: false
      }));

      await base44.entities.Reminder.bulkCreate(reminders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowReminderDialog(false);
    },
  });

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const selectedDateBookings = bookings.filter(b => 
    isSameDay(new Date(b.start_time), selectedDate)
  );

  const upcomingBookings = bookings
    .filter(b => new Date(b.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  if (isLoadingReminders || isLoadingBookings) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading timeline...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Timeline & Deadlines</h1>
            <p className="text-gray-600 mt-1">
              {isAdmin && !viewAsEmail
                ? 'View all partner tasks, reminders, and bookings'
                : 'Manage your tasks, view important deadlines, and schedule meetings'}
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && !viewAsEmail && (
              <>
                <Button
                  onClick={() => setShowReminderDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Reminder
                </Button>
              </>
            )}
            {(!isAdmin || viewAsEmail) && (
              <Button
                onClick={() => setShowBookingDialog(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isAdmin && !viewAsEmail ? 'grid-cols-3' : 'grid-cols-2'} md:w-fit mx-auto md:mx-0`}>
            <TabsTrigger value="calendar">
              <CalendarIcon className="w-4 h-4 mr-2" /> Calendar
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <CheckSquare className="w-4 h-4 mr-2" /> Tasks
              {activeReminders.length > 0 && (
                <Badge variant="destructive" className="ml-2">{activeReminders.length}</Badge>
              )}
            </TabsTrigger>
            {isAdmin && !viewAsEmail && (
              <TabsTrigger value="admin">
                <AlertCircle className="w-4 h-4 mr-2" /> Admin Controls
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            {(!isAdmin || viewAsEmail) && profile?.account_manager_name && (
              <Card className="mb-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Video className="w-6 h-6" />
                    Schedule Meeting with Your Account Manager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                      <UserCircle className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{profile.account_manager_name}</h3>
                      <p className="text-gray-600 mb-3">Your Dedicated Account Manager</p>
                      <div className="flex flex-wrap gap-4 mb-4">
                        {profile.account_manager_email && (
                          <a 
                            href={`mailto:${profile.account_manager_email}`}
                            className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 hover:underline font-medium"
                          >
                            <Mail className="w-4 h-4" />
                            {profile.account_manager_email}
                          </a>
                        )}
                        {profile.account_manager_phone && (
                          <a 
                            href={`tel:${profile.account_manager_phone}`}
                            className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 hover:underline font-medium"
                          >
                            <Phone className="w-4 h-4" />
                            {profile.account_manager_phone}
                          </a>
                        )}
                      </div>
                      {profile.account_manager_calendly_url ? (
                        <Button
                          asChild
                          className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 shadow-lg"
                        >
                          <a href={profile.account_manager_calendly_url} target="_blank" rel="noopener noreferrer">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Schedule a Meeting
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                        </Button>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          Contact your account manager to schedule a meeting
                        </div>
                      )}
                    </div>
                  </div>

                  {profile.account_manager_calendly_url && (
                    <div className="mt-6 pt-6 border-t border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-3">About Meeting Scheduling:</h4>
                      <ul className="text-sm text-gray-700 space-y-2">
                        <li className="flex items-start gap-2">
                          <CalendarIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Click "Schedule a Meeting" to view available time slots</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Book 1-on-1 sessions for partnership discussions, questions, or support</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Video className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Meetings will be held via video call - you'll receive the meeting link after booking</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {format(currentMonth, 'MMMM yyyy')}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date())}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {daysInMonth.map((day) => {
                      const dayBookings = bookings.filter(b => 
                        isSameDay(new Date(b.start_time), day)
                      );
                      const isSelected = isSameDay(day, selectedDate);
                      const isCurrentDay = isToday(day);

                      return (
                        <motion.button
                          key={day.toString()}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedDate(day)}
                          className={`
                            aspect-square p-2 rounded-lg border-2 transition-all
                            ${isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-blue-200'
                            }
                            ${isCurrentDay ? 'bg-indigo-50' : ''}
                          `}
                        >
                          <div className="text-sm font-semibold">
                            {format(day, 'd')}
                          </div>
                          {dayBookings.length > 0 && (
                            <div className="mt-1 flex justify-center gap-1">
                              {dayBookings.slice(0, 3).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              ))}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateBookings.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDateBookings.map(booking => (
                        <BookingCard key={booking.id} booking={booking} compact isAdmin={isAdmin && !viewAsEmail} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">No bookings for this day</p>
                      {(!isAdmin || viewAsEmail) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => setShowBookingDialog(true)}
                        >
                          Add Booking
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 shadow-md">
              <CardHeader>
                <CardTitle>
                  All Upcoming Bookings
                  {isAdmin && !viewAsEmail && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      (All Partners)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingBookings.length > 0 ? (
                    upcomingBookings.map(booking => (
                      <BookingCard key={booking.id} booking={booking} isAdmin={isAdmin && !viewAsEmail} />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      {isAdmin && !viewAsEmail
                        ? 'No partner bookings scheduled'
                        : 'No upcoming bookings'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-blue-100 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Tasks</p>
                      <p className="text-3xl font-bold text-blue-600">{activeReminders.length}</p>
                    </div>
                    <CheckSquare className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-100 shadow-md">
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

              <Card className="border-green-100 shadow-md">
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

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>
                  {isAdmin && !viewAsEmail ? 'All Partner Tasks' : 'Your Tasks'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active" className="w-full">
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
          </TabsContent>

          {isAdmin && !viewAsEmail && (
            <TabsContent value="admin" className="mt-6">
              <div className="grid gap-6">
                <Card className="shadow-md border-purple-100">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Admin Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={() => setShowReminderDialog(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-auto py-6 flex flex-col items-start"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Plus className="w-5 h-5" />
                          <span className="font-bold text-lg">Create Custom Reminder</span>
                        </div>
                        <span className="text-sm text-blue-100">Send task reminders to partners</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Recent Admin Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reminders.slice(0, 10).map((reminder) => (
                        <div key={reminder.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={getPriorityColor(reminder.priority)}>
                                {reminder.priority}
                              </Badge>
                              <Badge variant="outline">{reminder.reminder_type.replace(/_/g, ' ')}</Badge>
                            </div>
                            <h4 className="font-semibold">{reminder.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{reminder.message}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                              <span>Partner: {reminder.partner_email}</span>
                              <span>Due: {format(new Date(reminder.due_date), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {reminders.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No reminders created yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>

      {showBookingDialog && (!isAdmin || viewAsEmail) && (
        <BookingDialog
          onClose={() => setShowBookingDialog(false)}
          onSubmit={(data) => createBookingMutation.mutate({ ...data, partner_email: effectiveEmail })}
          isLoading={createBookingMutation.isPending}
          selectedDate={selectedDate}
        />
      )}

      {showReminderDialog && isAdmin && (
        <CreateReminderDialog
          onClose={() => setShowReminderDialog(false)}
          onSubmit={(data) => createReminderMutation.mutate(data)}
          isLoading={createReminderMutation.isPending}
        />
      )}
    </div>
  );
}