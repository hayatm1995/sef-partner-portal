import React from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Award, 
  CheckCircle, 
  Clock, 
  Package,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

export default function StatusWidgets({ user, isAdmin }) {
  // Fetch deliverables
  const { data: deliverables = [] } = useQuery({
    queryKey: ['userDeliverables', user?.email],
    queryFn: async () => {
      if (user?.role === 'admin') {
        return base44.entities.Deliverable.list();
      }
      return base44.entities.Deliverable.filter({ partner_email: user?.email });
    },
    enabled: !!user,
  });

  // Fetch nominations
  const { data: nominations = [] } = useQuery({
    queryKey: ['userNominations', user?.email],
    queryFn: async () => {
      if (user?.role === 'admin') {
        return base44.entities.Nomination.list();
      }
      return base44.entities.Nomination.filter({ partner_email: user?.email });
    },
    enabled: !!user,
  });

  // Fetch reminders
  const { data: reminders = [] } = useQuery({
    queryKey: ['activeReminders', user?.email],
    queryFn: () => base44.entities.Reminder.filter({ 
      partner_email: user?.email, 
      is_dismissed: false 
    }),
    enabled: !!user && !isAdmin,
  });

  const widgets = isAdmin ? [
    {
      title: "Total Deliverables",
      value: deliverables.length,
      icon: FileText,
      gradient: "from-blue-500 to-blue-600",
      subtitle: "All partners"
    },
    {
      title: "Pending Review",
      value: deliverables.filter(d => d.status === 'pending_review').length,
      icon: Clock,
      gradient: "from-orange-500 to-orange-600",
      subtitle: "Needs attention"
    },
    {
      title: "Total Nominations",
      value: nominations.length,
      icon: Award,
      gradient: "from-purple-500 to-purple-600",
      subtitle: "All submissions"
    },
    {
      title: "Approved Items",
      value: deliverables.filter(d => d.status === 'approved').length,
      icon: CheckCircle,
      gradient: "from-green-500 to-green-600",
      subtitle: "Ready to go"
    }
  ] : [
    {
      title: "Total Deliverables",
      value: deliverables.length,
      icon: FileText,
      gradient: "from-blue-500 to-blue-600",
      subtitle: `${deliverables.filter(d => d.status === 'approved').length} approved`
    },
    {
      title: "Contract Status",
      value: user?.contract_status || 'pending',
      icon: user?.contract_status === 'signed' ? CheckCircle : Clock,
      gradient: user?.contract_status === 'signed' 
        ? "from-green-500 to-green-600"
        : "from-yellow-500 to-yellow-600",
      subtitle: user?.contract_status === 'signed' ? 'Active' : 'Needs signing',
      isBadge: true
    },
    {
      title: "VIP Box Status",
      value: user?.vip_box_delivery_status || 'pending',
      icon: Package,
      gradient: "from-purple-500 to-purple-600",
      subtitle: user?.vip_box_assigned ? 'Assigned' : 'Not assigned',
      isBadge: true
    },
    {
      title: "Active Reminders",
      value: reminders.length,
      icon: AlertCircle,
      gradient: reminders.length > 0 
        ? "from-red-500 to-red-600"
        : "from-gray-400 to-gray-500",
      subtitle: reminders.length > 0 ? 'Action needed' : 'All clear'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {widgets.map((widget, index) => (
        <motion.div
          key={widget.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5 }}
        >
          <Card className="border-orange-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardContent className="p-6 relative">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${widget.gradient} opacity-10 rounded-full transform translate-x-8 -translate-y-8`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">{widget.title}</p>
                  <div className={`p-3 bg-gradient-to-br ${widget.gradient} rounded-xl shadow-lg`}>
                    <widget.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                {widget.isBadge ? (
                  <Badge className="mb-2 capitalize">
                    {widget.value.replace(/_/g, ' ')}
                  </Badge>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mb-2">{widget.value}</p>
                )}
                <p className="text-sm text-gray-500">{widget.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}