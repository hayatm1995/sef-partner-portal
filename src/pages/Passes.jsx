import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Users,
  Sparkles,
  Gift,
  Copy,
  ExternalLink,
  Percent,
  Hash
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Passes() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: loginMapping } = useQuery({
    queryKey: ['loginMapping', user?.email],
    queryFn: async () => {
      const mappings = await base44.entities.PartnerLogin.filter({
        login_email: user?.email,
        status: 'active'
      });
      return mappings[0] || null;
    },
    enabled: !!user && user?.role !== 'admin' && !user?.is_super_admin
  });

  const effectivePartnerEmail = loginMapping?.partner_email || user?.email;

  const { data: profile } = useQuery({
    queryKey: ['partnerProfile', effectivePartnerEmail],
    queryFn: async () => {
      const profiles = await base44.entities.PartnerProfile.filter({
        partner_email: effectivePartnerEmail
      });
      return profiles[0] || null;
    },
    enabled: !!user && user?.role !== 'admin' && !user?.is_super_admin
  });

  const handleCopyPromoCode = () => {
    if (profile?.promo_code) {
      navigator.clipboard.writeText(profile.promo_code);
      toast.success('Promo code copied to clipboard!');
    }
  };

  const ticketTypes = [
    {
      id: 1,
      name: "PREMIUM",
      subtitle: "All-Access Partner Pass",
      price: "AED 1,999",
      description: "Our most exclusive all-access experience - the ultimate way to enjoy SEF",
      gradient: "from-purple-600 via-purple-500 to-purple-400",
      link: "https://app.sharjahef.com/t2/tickets/C49F2A",
      features: [
        "Main Stage Unlimited Access",
        "All Sessions Access",
        "Masterclasses (Free & Paid)",
        "Reserved Seating",
        "Fast-Track Entry",
        "SEF Souq Access",
        "SEF Eats Included",
        "SEF Vault Access",
        "Welcome Box",
        "Free Parking"
      ],
      active: true
    },
    {
      id: 2,
      name: "BELONG",
      subtitle: "Full-Day Access",
      price: "AED 249",
      description: "Your all-day access to the energy, ideas and connections",
      gradient: "from-green-600 via-green-500 to-green-400",
      link: "https://app.sharjahef.com/t2/tickets/4B02B0",
      features: [
        "Main Stage Access",
        "Sessions Access",
        "Free Masterclasses Included",
        "Paid Masterclasses Add-on Available",
        "SEF Souq Access",
        "SEF Eats",
        "Networking Areas"
      ],
      active: true
    },
    {
      id: 3,
      name: "STUDENT",
      subtitle: "Student Access",
      price: "FREE",
      description: "Empowering the next generation of changemakers",
      gradient: "from-orange-600 via-orange-500 to-orange-400",
      link: "https://form.jotform.com/Sheraa/student-registration",
      features: [
        "Main Stage Access",
        "Sessions Access",
        "Free Masterclasses Included",
        "Paid Masterclasses Add-on Available",
        "SEF Souq Access",
        "Empowering students to join the conversation"
      ],
      active: true
    },
    {
      id: 4,
      name: "MEYDAN",
      subtitle: "SEF Heartbeat Access",
      price: "AED 35",
      description: "Step into the SEF heartbeat - food & cultural experiences",
      gradient: "from-pink-600 via-purple-500 to-purple-400",
      link: "https://sharjahef.com/festival-pass/#meydan-pass",
      features: [
        "Limited Access",
        "SEF Souq Access",
        "SEF Eats Access",
        "Food & Cultural Experiences",
        "Visitors wanting food experiences only"
      ],
      active: true
    }
  ];

  const eventInfo = {
    dates: "January 31 - February 1, 2026",
    location: "SRTIP - Sharjah Research Technology and Innovation Park",
    venue: "Sharjah, UAE"
  };

  const eventSchedule = [
    {
      date: "January 31, 2026",
      events: [
        { time: "8:00 AM", title: "Registration Opens", icon: Clock },
        { time: "9:00 AM", title: "Opening Ceremony", icon: Sparkles },
        { time: "10:00 AM", title: "Keynote Sessions", icon: Users },
        { time: "2:00 PM", title: "Workshop Sessions", icon: Users },
        { time: "6:00 PM", title: "Networking Reception", icon: Users }
      ]
    },
    {
      date: "February 1, 2026",
      events: [
        { time: "9:00 AM", title: "Exhibition Opens", icon: Clock },
        { time: "10:00 AM", title: "Panel Discussions", icon: Users },
        { time: "1:00 PM", title: "Startup Pitches", icon: Sparkles },
        { time: "4:00 PM", title: "Awards Ceremony", icon: Gift },
        { time: "6:00 PM", title: "Closing Reception", icon: Users }
      ]
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-xl"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mb-48 blur-xl"
          />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Ticket className="w-12 h-12" />
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                WHERE WE BELONG
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">SEF Access & Passes</h1>
            <p className="text-xl text-white/90 mb-6 max-w-2xl">
              Get your passes for the Sharjah Entrepreneurship Festival 2026
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">{eventInfo.dates}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <MapPin className="w-5 h-5" />
                <span className="font-semibold">{eventInfo.location}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <Card className="border-purple-100 h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Event Days</p>
                  <p className="text-3xl font-bold text-purple-700">2 Days</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <Card className="border-green-100 h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expected Attendees</p>
                    <p className="text-3xl font-bold text-green-700">15,000+</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Partner Promo Code Card */}
        {profile?.promo_code && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.01 }}
            className="mb-8"
          >
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Gift className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Exclusive Promo Code</h3>
                    <p className="text-gray-600 mb-4">
                      Share this code with your community for a special discount on BELONG passes
                    </p>
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex items-center gap-3 bg-white rounded-lg px-6 py-3 border-2 border-purple-300">
                        <Hash className="w-5 h-5 text-purple-600" />
                        <span className="font-mono font-bold text-2xl text-purple-700">
                          {profile.promo_code}
                        </span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-300 text-lg px-4 py-2">
                        <Percent className="w-4 h-4 mr-1" />
                        {profile.promo_discount_percentage}% OFF
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-lg px-4 py-2">
                        <Ticket className="w-4 h-4 mr-1" />
                        {profile.promo_pass_limit} Passes
                      </Badge>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleCopyPromoCode}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Ticket Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Access Passes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ticketTypes.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
                className="h-full"
              >
                <Card className="overflow-hidden border-2 hover:border-orange-300 hover:shadow-2xl transition-all shadow-xl h-full flex flex-col">
                  <div className={`bg-gradient-to-br ${ticket.gradient} p-8 text-white relative overflow-hidden`}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                      className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-20 -mb-20"
                    />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                          WHERE WE BELONG
                        </Badge>
                        {ticket.active && <CheckCircle className="w-6 h-6" />}
                      </div>

                      <h3 className="text-4xl font-bold mb-2">{ticket.name}</h3>
                      <p className="text-white/90 text-lg mb-4">{ticket.subtitle}</p>
                      <div className="text-3xl font-bold">{ticket.price}</div>

                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30 mt-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-5 h-5" />
                          <span className="font-semibold">{eventInfo.dates}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5" />
                          <span className="font-semibold">{eventInfo.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col">
                    <p className="text-gray-700 mb-4 min-h-[48px]">{ticket.description}</p>

                    <div className="space-y-2 mb-6 flex-1">
                      {ticket.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg mt-auto"
                        asChild
                      >
                        <a href={ticket.link} target="_blank" rel="noopener noreferrer">
                          GET YOUR PASS
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Event Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="mb-8 border-blue-100 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                Event Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {eventSchedule.map((day, dayIndex) => (
                  <motion.div
                    key={dayIndex}
                    initial={{ opacity: 0, x: dayIndex === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + dayIndex * 0.1 }}
                  >
                    <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      {day.date}
                    </h3>
                    <div className="space-y-3">
                      {day.events.map((event, eventIndex) => (
                        <motion.div
                          key={eventIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.7 + eventIndex * 0.05 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <event.icon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-gray-900">{event.title}</p>
                            <p className="text-sm text-gray-600">{event.time}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Important Information */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="border-orange-100 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-600" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">What to Bring</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Valid government-issued ID</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Digital or printed ticket confirmation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Business cards for networking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Laptop/tablet if attending workshops</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Venue Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">SRTIP - Sharjah Research Technology and Innovation Park</p>
                      <p className="text-gray-600">Al Dhaid Road, Sharjah, UAE</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Daily Hours</p>
                      <p className="text-gray-600">8:00 AM - 7:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}