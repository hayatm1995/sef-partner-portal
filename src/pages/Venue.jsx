import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Phone, Mail, Building, Car, Plane, Info, MapPinned, Utensils, Store, Users, Presentation, Coffee, Edit, Plus, Trash2, Save } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const iconMap = {
  Presentation,
  Users,
  Store,
  Utensils,
  Coffee,
  MapPinned,
  Info,
  MapPin,
  Building
};

export default function Venue() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingVenue, setEditingVenue] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [addingLocation, setAddingLocation] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = user?.role === 'admin' || user?.is_super_admin;

  const { data: venueInfoData } = useQuery({
    queryKey: ['venueInfo'],
    queryFn: async () => {
      const venues = await base44.entities.VenueInfo.list();
      return venues[0] || null;
    }
  });

  const { data: locationsData = [] } = useQuery({
    queryKey: ['venueLocations'],
    queryFn: async () => {
      const locs = await base44.entities.VenueLocation.filter({ is_active: true });
      return locs;
    }
  });

  const updateVenueMutation = useMutation({
    mutationFn: (data) => {
      if (venueInfoData?.id) {
        return base44.entities.VenueInfo.update(venueInfoData.id, data);
      }
      return base44.entities.VenueInfo.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venueInfo'] });
      toast.success('Venue information updated');
      setEditingVenue(false);
    }
  });

  const createLocationMutation = useMutation({
    mutationFn: (data) => base44.entities.VenueLocation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venueLocations'] });
      toast.success('Location added');
      setAddingLocation(false);
    }
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VenueLocation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venueLocations'] });
      toast.success('Location updated');
      setEditingLocation(null);
    }
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id) => base44.entities.VenueLocation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venueLocations'] });
      toast.success('Location deleted');
    }
  });

  const venueInfo = venueInfoData || {
    venue_name: "Sharjah Research Technology and Innovation Park (SRTIP)",
    address: "University City Rd, Sharjah, United Arab Emirates",
    latitude: 25.322141,
    longitude: 55.488435,
    phone: "+971 6 505 8000",
    email: "info@srtip.ae",
    website: "https://sharjahef.com",
    parking_info: [
      "Free parking available on-site",
      "Valet parking for VIP pass holders",
      "Multiple parking zones with clear signage",
      "Accessible parking near main entrance"
    ],
    facilities: [
      "Air-conditioned halls and meeting rooms",
      "High-speed WiFi throughout",
      "Food court and refreshment areas",
      "Prayer rooms",
      "First aid and medical services",
      "Accessible facilities",
      "Registration and information desks",
      "VIP lounges"
    ]
  };

  const locations = locationsData.map(loc => ({
    ...loc,
    icon: iconMap[loc.icon_name] || MapPin,
    coordinates: [loc.latitude, loc.longitude]
  }));

  const categories = [
    { id: 'all', label: 'All Locations', icon: MapPin, color: 'bg-gray-600' },
    { id: 'stage', label: 'Main Stages', icon: Presentation, color: 'bg-orange-600' },
    { id: 'workshop', label: 'Workshops', icon: Users, color: 'bg-blue-600' },
    { id: 'souq', label: 'SEF Souq', icon: Store, color: 'bg-purple-600' },
    { id: 'dining', label: 'Dining', icon: Utensils, color: 'bg-green-600' },
    { id: 'networking', label: 'Networking', icon: Users, color: 'bg-amber-600' },
    { id: 'vip', label: 'VIP Areas', icon: MapPinned, color: 'bg-pink-600' },
    { id: 'service', label: 'Services', icon: Info, color: 'bg-cyan-600' }
  ];

  const filteredLocations = selectedCategory === 'all' 
    ? locations 
    : locations.filter(loc => loc.category === selectedCategory);

  const handleLocationClick = (location) => {
    setSelectedLocation(location.coordinates);
  };

  const handleNavigate = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&hl=en`, '_blank');
  };

  const directions = [
  {
    method: "By Car from Dubai",
    time: "30-40 minutes",
    description: "Take Sheikh Mohammed Bin Zayed Road (E311) towards Sharjah, exit at University City",
    icon: Car
  },
  {
    method: "From Sharjah Airport",
    time: "15-20 minutes",
    description: "10 km via Airport Road and University City Road",
    icon: Plane
  },
  {
    method: "Public Transport",
    time: "Various routes",
    description: "Multiple bus routes serve SRTIP. Check RTA Sharjah for schedules",
    icon: Building
  }];


  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Venue Information</h1>
          <p className="text-gray-600">Everything you need to know about the SEF 2026 venue</p>
        </div>

        {/* Hero Card with Main Info */}
        <Card className="mb-8 border-orange-200/50 shadow-2xl overflow-hidden">
          <div className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 p-10 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
            <div className="relative flex items-start gap-6">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center flex-shrink-0 shadow-2xl border border-white/20">
                <Building className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-4 tracking-tight">{venueInfo.venue_name}</h2>
                <p className="text-white/95 text-xl mb-6 font-medium">{venueInfo.address}</p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg"
                    onClick={() => handleNavigate(venueInfo.latitude, venueInfo.longitude)}>
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm font-semibold"
                    onClick={() => window.open(venueInfo.website, '_blank')}>
                    <Info className="w-4 h-4 mr-2" />
                    Visit Website
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm font-semibold"
                      onClick={() => setEditingVenue(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Venue Info
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Interactive Map Section */}
        <Card className="mb-8 border-blue-200/50 shadow-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Interactive Venue Map
                  </span>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-3 ml-15 font-medium">
                  Explore event locations, filter by category, and get navigation assistance
                </p>
              </div>
              {isAdmin && (
                <Button 
                  onClick={() => setAddingLocation(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Category Filters */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`${selectedCategory === category.id ? category.color : ''}`}
                  >
                    <category.icon className="w-4 h-4 mr-2" />
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Interactive Leaflet Map with Location Pins */}
            <div className="w-full h-[600px] rounded-lg overflow-hidden border-2 border-gray-200 mb-6 relative">
              <MapContainer
                center={[venueInfo.latitude, venueInfo.longitude]}
                zoom={17}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Main Venue Marker */}
                <Marker position={[venueInfo.latitude, venueInfo.longitude]}>
                  <Popup>
                    <div className="text-center">
                      <strong>{venueInfo.venue_name}</strong>
                      <br />
                      <small>{venueInfo.address}</small>
                      <br />
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => handleNavigate(venueInfo.latitude, venueInfo.longitude)}
                      >
                        Navigate
                      </Button>
                    </div>
                  </Popup>
                </Marker>

                {/* Location Markers */}
                {filteredLocations.map((location) => {
                  const customIcon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background-color: ${location.color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">${filteredLocations.indexOf(location) + 1}</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                  });

                  return (
                    <Marker
                      key={location.id}
                      position={[location.latitude, location.longitude]}
                      icon={customIcon}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <strong>{location.name}</strong>
                          <br />
                          <small className="text-gray-600">{location.description}</small>
                          <br />
                          <Badge className="mt-2">{location.category}</Badge>
                          <br />
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => handleNavigate(location.latitude, location.longitude)}
                          >
                            Navigate Here
                          </Button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
              
              <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
                <p className="text-xs text-gray-600 mb-2">📍 {filteredLocations.length + 1} locations</p>
                <p className="text-xs text-blue-600">Click markers for details</p>
              </div>
            </div>

            {/* Interactive Location Pins Overlay */}
            <Card className="mb-6 border-blue-100">
              <CardHeader>
                <CardTitle className="text-lg">📍 All Venue Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredLocations.map((location, index) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: location.color }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <location.icon className="w-4 h-4" style={{ color: location.color }} />
                          <span className="font-medium">{location.name}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleNavigate(location.latitude, location.longitude)}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Navigate
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location List with Admin Controls */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLocations.map((location) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${location.color}20` }}
                    >
                      <location.icon className="w-5 h-5" style={{ color: location.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1">{location.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{location.description}</p>
                      <Badge variant="outline" className="text-xs">{location.category}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleNavigate(location.latitude, location.longitude)}
                      className="flex-1 text-xs h-8"
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Navigate
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingLocation(location)}
                          className="text-xs h-8"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteLocationMutation.mutate(location.id)}
                          className="text-xs h-8 text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Contact Information */}
          <Card className="border-blue-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <a href={`tel:${venueInfo.phone}`} className="font-medium text-gray-900 hover:text-blue-600">
                    {venueInfo.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href={`mailto:${venueInfo.email}`} className="font-medium text-gray-900 hover:text-blue-600">
                    {venueInfo.email}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  <a
                    href={venueInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-900 hover:text-blue-600">

                    {venueInfo.website.replace('https://', '')}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parking Information */}
          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-purple-600" />
                Parking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-3">
                {venueInfo.parking_info?.map((info, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{info}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Getting There */}
        <Card className="mb-8 border-orange-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-orange-600" />
              Getting There
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {directions.map((direction, index) =>
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                      <direction.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{direction.method}</h3>
                      <p className="text-sm text-gray-600">{direction.time}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{direction.description}</p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Facilities */}
        <Card className="border-green-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-green-600" />
              Venue Facilities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {venueInfo.facilities?.map((facility, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{facility}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admin Dialogs */}
        <VenueInfoDialog
          open={editingVenue}
          onOpenChange={setEditingVenue}
          venueInfo={venueInfo}
          onSave={(data) => updateVenueMutation.mutate(data)}
        />
        
        <LocationDialog
          open={addingLocation || !!editingLocation}
          onOpenChange={(open) => {
            if (!open) {
              setAddingLocation(false);
              setEditingLocation(null);
            }
          }}
          location={editingLocation}
          onSave={(data) => {
            if (editingLocation) {
              updateLocationMutation.mutate({ id: editingLocation.id, data });
            } else {
              createLocationMutation.mutate(data);
            }
          }}
        />
      </motion.div>
    </div>
  );
}

function VenueInfoDialog({ open, onOpenChange, venueInfo, onSave }) {
  const [formData, setFormData] = React.useState(venueInfo);

  React.useEffect(() => {
    setFormData(venueInfo);
  }, [venueInfo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Venue Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Venue Name *</Label>
              <Input
                value={formData.venue_name || ''}
                onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Address *</Label>
            <Input
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Latitude *</Label>
              <Input
                type="number"
                step="0.000001"
                value={formData.latitude || ''}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label>Longitude *</Label>
              <Input
                type="number"
                step="0.000001"
                value={formData.longitude || ''}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Parking Information (one per line)</Label>
            <Textarea
              rows={4}
              value={formData.parking_info?.join('\n') || ''}
              onChange={(e) => setFormData({ ...formData, parking_info: e.target.value.split('\n').filter(Boolean) })}
              placeholder="Free parking available on-site&#10;Valet parking for VIP pass holders"
            />
          </div>

          <div>
            <Label>Facilities (one per line)</Label>
            <Textarea
              rows={6}
              value={formData.facilities?.join('\n') || ''}
              onChange={(e) => setFormData({ ...formData, facilities: e.target.value.split('\n').filter(Boolean) })}
              placeholder="Air-conditioned halls&#10;High-speed WiFi"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LocationDialog({ open, onOpenChange, location, onSave }) {
  const [formData, setFormData] = React.useState(location || {
    name: '',
    category: 'other',
    latitude: 25.322141,
    longitude: 55.488435,
    description: '',
    color: '#f97316',
    icon_name: 'MapPin',
    is_active: true
  });

  React.useEffect(() => {
    if (location) {
      setFormData(location);
    }
  }, [location]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{location ? 'Edit Location' : 'Add New Location'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Location Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stage">Main Stage</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="souq">SEF Souq</SelectItem>
                  <SelectItem value="dining">Dining</SelectItem>
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="vip">VIP Area</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Latitude *</Label>
              <Input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label>Longitude *</Label>
              <Input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Icon Name</Label>
              <Select value={formData.icon_name} onValueChange={(value) => setFormData({ ...formData, icon_name: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Presentation">Presentation</SelectItem>
                  <SelectItem value="Users">Users</SelectItem>
                  <SelectItem value="Store">Store</SelectItem>
                  <SelectItem value="Utensils">Utensils</SelectItem>
                  <SelectItem value="Coffee">Coffee</SelectItem>
                  <SelectItem value="MapPinned">MapPinned</SelectItem>
                  <SelectItem value="Info">Info</SelectItem>
                  <SelectItem value="MapPin">MapPin</SelectItem>
                  <SelectItem value="Building">Building</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Marker Color</Label>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              {location ? 'Update' : 'Create'} Location
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}