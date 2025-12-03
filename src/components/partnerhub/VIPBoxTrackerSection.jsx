import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, MapPin, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function VIPBoxTrackerSection({ partnerEmail, isAdmin }) {
  const { data: tracker } = useQuery({
    queryKey: ['vipBoxTracker', partnerEmail],
    queryFn: async () => {
      const results = await base44.entities.VIPBoxTracker.filter({ partner_email: partnerEmail });
      return results[0] || null;
    },
    enabled: !!partnerEmail,
  });

  const getStatusInfo = (status) => {
    const info = {
      preparing: {
        label: "Preparing",
        color: "bg-gray-100 text-gray-800",
        icon: Package,
        description: "Your VIP box is being prepared"
      },
      shipped: {
        label: "Shipped",
        color: "bg-blue-100 text-blue-800",
        icon: Truck,
        description: "Your VIP box has been shipped"
      },
      in_transit: {
        label: "In Transit",
        color: "bg-yellow-100 text-yellow-800",
        icon: MapPin,
        description: "Your VIP box is on its way"
      },
      delivered: {
        label: "Delivered",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        description: "Your VIP box has been delivered"
      },
      received: {
        label: "Received",
        color: "bg-purple-100 text-purple-800",
        icon: CheckCircle,
        description: "VIP box confirmed received"
      }
    };
    return info[status] || info.preparing;
  };

  if (!tracker) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No VIP Box Assigned</h3>
          <p className="text-gray-600">Contact your account manager for VIP box information</p>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(tracker.shipping_status);
  const StatusIcon = statusInfo.icon;

  const steps = [
    { status: 'preparing', label: 'Preparing' },
    { status: 'shipped', label: 'Shipped' },
    { status: 'in_transit', label: 'In Transit' },
    { status: 'delivered', label: 'Delivered' },
    { status: 'received', label: 'Received' }
  ];

  const currentStepIndex = steps.findIndex(s => s.status === tracker.shipping_status);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">VIP Box & Logistics Tracker</h3>
        <p className="text-sm text-gray-600">Track your VIP box shipment status</p>
      </div>

      <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <StatusIcon className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <Badge className={`${statusInfo.color} text-lg px-4 py-2 mb-2`}>
                  {statusInfo.label}
                </Badge>
                <p className="text-gray-700">{statusInfo.description}</p>
              </div>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="relative">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={step.status} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      index <= currentStepIndex
                        ? 'bg-orange-600 border-orange-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {index <= currentStepIndex ? '✓' : index + 1}
                  </div>
                  <p className={`text-xs mt-2 ${index <= currentStepIndex ? 'text-orange-700 font-medium' : 'text-gray-500'}`}>
                    {step.label}
                  </p>
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute h-0.5 top-5 ${
                        index < currentStepIndex ? 'bg-orange-600' : 'bg-gray-300'
                      }`}
                      style={{
                        left: `${(index + 0.5) * (100 / steps.length)}%`,
                        width: `${100 / steps.length}%`
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {tracker.tracking_number && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Tracking Number</p>
              <p className="text-lg font-semibold font-mono">{tracker.tracking_number}</p>
            </CardContent>
          </Card>
        )}

        {tracker.shipping_address && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Shipping Address</p>
              <p className="text-gray-700">{tracker.shipping_address}</p>
            </CardContent>
          </Card>
        )}

        {tracker.shipped_date && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Shipped Date</p>
              <p className="text-gray-700">{format(new Date(tracker.shipped_date), 'MMMM d, yyyy')}</p>
            </CardContent>
          </Card>
        )}

        {tracker.estimated_delivery && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Estimated Delivery</p>
              <p className="text-gray-700">{format(new Date(tracker.estimated_delivery), 'MMMM d, yyyy')}</p>
            </CardContent>
          </Card>
        )}

        {tracker.delivered_date && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Delivered Date</p>
              <p className="text-gray-700">{format(new Date(tracker.delivered_date), 'MMMM d, yyyy')}</p>
            </CardContent>
          </Card>
        )}

        {tracker.received_by && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Received By</p>
              <p className="text-gray-700">{tracker.received_by}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {isAdmin && tracker.admin_notes && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-sm">Admin Notes (Internal Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 text-sm">{tracker.admin_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}