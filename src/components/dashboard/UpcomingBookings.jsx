import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function UpcomingBookings({ bookings }) {
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

  return (
    <Card className="border-orange-100 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Upcoming Events</CardTitle>
          <Link to={createPageUrl("Calendar")}>
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{booking.title}</h4>
                  <Badge variant="outline" className={getTypeColor(booking.booking_type)}>
                    {booking.booking_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(booking.start_time), 'MMM d, yyyy')}</span>
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No upcoming events</p>
            <Link to={createPageUrl("Calendar")}>
              <Button variant="outline" size="sm" className="mt-3">
                Book Now
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}