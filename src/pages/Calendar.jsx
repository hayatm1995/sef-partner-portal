import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Video, UserCircle, Mail, Phone, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";

import BookingDialog from "../components/calendar/BookingDialog";
import BookingCard from "../components/calendar/BookingCard";

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showBookingDialog, setShowBookingDialog] = useState(false);
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

  const { data: bookings = [] } = useQuery({
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

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const selectedDateBookings = bookings.filter(b => 
    isSameDay(new Date(b.start_time), selectedDate)
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Calendar & Meetings</h1>
            <p className="text-gray-600 mt-1">
              {isAdmin && !viewAsEmail
                ? 'View all partner bookings and event schedule'
                : 'Book Day Zero tours, event sessions, and meet with your Account Manager'}
            </p>
          </div>
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
          <Card className="lg:col-span-2 border-orange-100 shadow-md">
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
                {days.map((day) => {
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
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-orange-200'
                        }
                        ${isCurrentDay ? 'bg-blue-50' : ''}
                      `}
                    >
                      <div className="text-sm font-semibold">
                        {format(day, 'd')}
                      </div>
                      {dayBookings.length > 0 && (
                        <div className="mt-1 flex justify-center gap-1">
                          {dayBookings.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selectedDate, 'MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateBookings.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} compact />
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

        <Card className="mt-6 border-orange-100 shadow-md">
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
              {bookings
                .filter(b => new Date(b.start_time) > new Date())
                .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                .map(booking => (
                  <div key={booking.id}>
                    <BookingCard booking={booking} />
                    {isAdmin && !viewAsEmail && (
                      <p className="text-xs text-gray-500 mt-1 ml-2">
                        Partner: {booking.partner_email}
                      </p>
                    )}
                  </div>
                ))}
              {bookings.filter(b => new Date(b.start_time) > new Date()).length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  {isAdmin && !viewAsEmail
                    ? 'No partner bookings scheduled'
                    : 'No upcoming bookings'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {showBookingDialog && (!isAdmin || viewAsEmail) && (
        <BookingDialog
          onClose={() => setShowBookingDialog(false)}
          onSubmit={(data) => createBookingMutation.mutate({ ...data, partner_email: effectiveEmail })}
          isLoading={createBookingMutation.isPending}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}