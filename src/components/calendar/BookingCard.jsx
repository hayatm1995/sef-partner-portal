import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function BookingCard({ booking, compact = false }) {
  const getTypeColor = (type) => {
    const colors = {
      day_zero_tour: "bg-blue-100 text-blue-800",
      media_interview: "bg-purple-100 text-purple-800",
      workshop_setup: "bg-green-100 text-green-800",
      booth_walkthrough: "bg-orange-100 text-orange-800",
      networking_session: "bg-pink-100 text-pink-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status] || colors.pending;
  };

  if (compact) {
    return (
      <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-sm">{booking.title}</p>
          <Badge variant="outline" className={`${getTypeColor(booking.booking_type)} text-xs`}>
            {booking.booking_type.replace(/_/g, ' ')}
          </Badge>
        </div>
        <p className="text-xs text-gray-600">
          {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
        </p>
      </div>
    );
  }

  return (
    <Card className="border-orange-100 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg mb-1">{booking.title}</h3>
            <Badge variant="outline" className={getTypeColor(booking.booking_type)}>
              {booking.booking_type.replace(/_/g, ' ')}
            </Badge>
          </div>
          <Badge variant="outline" className={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(booking.start_time), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
            </span>
          </div>
          {booking.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{booking.location}</span>
            </div>
          )}
        </div>

        {booking.notes && (
          <p className="text-sm text-gray-600 mt-3 p-2 bg-gray-50 rounded">
            {booking.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}