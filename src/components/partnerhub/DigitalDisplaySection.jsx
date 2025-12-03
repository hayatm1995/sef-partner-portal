import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Monitor, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function DigitalDisplaySection({ partnerEmail, isAdmin, showAllPartners }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    display_type: "screen",
    location_description: "",
    width_pixels: "",
    height_pixels: "",
    aspect_ratio: "",
    file_formats: [],
    max_file_size_mb: "",
    duration_seconds: "",
    exposure_type: "high_traffic",
    additional_notes: ""
  });

  const queryClient = useQueryClient();

  const { data: displays = [] } = useQuery({
    queryKey: ['digitalDisplays', partnerEmail, showAllPartners],
    queryFn: async () => {
      if (showAllPartners) {
        return await base44.entities.DigitalDisplayRequirement.list('-created_date');
      }
      return await base44.entities.DigitalDisplayRequirement.filter({ partner_email: partnerEmail });
    },
    enabled: !!partnerEmail || showAllPartners,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DigitalDisplayRequirement.create({ 
      ...data, 
      partner_email: partnerEmail,
      status: 'details_submitted'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalDisplays'] });
      toast.success('Display requirements submitted successfully! 📺');
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to submit: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DigitalDisplayRequirement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalDisplays'] });
      toast.success('Display requirements updated! 📺');
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DigitalDisplayRequirement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalDisplays'] });
      toast.success('Display requirement deleted');
    },
  });

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      display_type: "screen",
      location_description: "",
      width_pixels: "",
      height_pixels: "",
      aspect_ratio: "",
      file_formats: [],
      max_file_size_mb: "",
      duration_seconds: "",
      exposure_type: "high_traffic",
      additional_notes: ""
    });
  };

  const handleEdit = (display) => {
    setEditingId(display.id);
    setFormData({
      display_type: display.display_type || "screen",
      location_description: display.location_description || "",
      width_pixels: display.width_pixels || "",
      height_pixels: display.height_pixels || "",
      aspect_ratio: display.aspect_ratio || "",
      file_formats: display.file_formats || [],
      max_file_size_mb: display.max_file_size_mb || "",
      duration_seconds: display.duration_seconds || "",
      exposure_type: display.exposure_type || "high_traffic",
      additional_notes: display.additional_notes || ""
    });
    setIsAdding(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      width_pixels: formData.width_pixels ? parseInt(formData.width_pixels) : null,
      height_pixels: formData.height_pixels ? parseInt(formData.height_pixels) : null,
      max_file_size_mb: formData.max_file_size_mb ? parseFloat(formData.max_file_size_mb) : null,
      duration_seconds: formData.duration_seconds ? parseInt(formData.duration_seconds) : null
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleFileFormatToggle = (format) => {
    setFormData(prev => ({
      ...prev,
      file_formats: prev.file_formats.includes(format)
        ? prev.file_formats.filter(f => f !== format)
        : [...prev.file_formats, format]
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_details: "bg-yellow-100 text-yellow-800",
      details_submitted: "bg-blue-100 text-blue-800",
      content_in_progress: "bg-purple-100 text-purple-800",
      content_sent: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: showAllPartners,
  });

  const getPartnerInfo = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return {
      name: partner?.full_name || email,
      company: partner?.company_name || ''
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Digital Display Requirements</h3>
          <p className="text-sm text-gray-600">
            {showAllPartners 
              ? 'View all digital display requirements from partners' 
              : 'Provide details for screens/billboards where Sheraa will create content for you'}
          </p>
        </div>
        {!isAdding && !showAllPartners && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-gradient-to-r from-blue-500 to-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Display
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle>{editingId ? 'Edit Display Requirements' : 'Add Display Requirements'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Display Type *</Label>
                      <Select
                        value={formData.display_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, display_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="screen">Screen</SelectItem>
                          <SelectItem value="billboard">Billboard</SelectItem>
                          <SelectItem value="led_wall">LED Wall</SelectItem>
                          <SelectItem value="digital_signage">Digital Signage</SelectItem>
                          <SelectItem value="video_wall">Video Wall</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Exposure Type *</Label>
                      <Select
                        value={formData.exposure_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, exposure_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high_traffic">High Traffic Area</SelectItem>
                          <SelectItem value="medium_traffic">Medium Traffic</SelectItem>
                          <SelectItem value="low_traffic">Low Traffic</SelectItem>
                          <SelectItem value="vip_area">VIP Area</SelectItem>
                          <SelectItem value="entrance">Entrance</SelectItem>
                          <SelectItem value="networking_zone">Networking Zone</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Location Description *</Label>
                    <Input
                      value={formData.location_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_description: e.target.value }))}
                      placeholder="e.g., Main Entrance Billboard, Food Court Screen"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Width (pixels)</Label>
                      <Input
                        type="number"
                        value={formData.width_pixels}
                        onChange={(e) => setFormData(prev => ({ ...prev, width_pixels: e.target.value }))}
                        placeholder="1920"
                      />
                    </div>
                    <div>
                      <Label>Height (pixels)</Label>
                      <Input
                        type="number"
                        value={formData.height_pixels}
                        onChange={(e) => setFormData(prev => ({ ...prev, height_pixels: e.target.value }))}
                        placeholder="1080"
                      />
                    </div>
                    <div>
                      <Label>Aspect Ratio</Label>
                      <Input
                        value={formData.aspect_ratio}
                        onChange={(e) => setFormData(prev => ({ ...prev, aspect_ratio: e.target.value }))}
                        placeholder="16:9"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Max File Size (MB)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.max_file_size_mb}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_file_size_mb: e.target.value }))}
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <Label>Duration (seconds)</Label>
                      <Input
                        type="number"
                        value={formData.duration_seconds}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration_seconds: e.target.value }))}
                        placeholder="30"
                      />
                      <p className="text-xs text-gray-500 mt-1">For video/animated content</p>
                    </div>
                  </div>

                  <div>
                    <Label>Accepted File Formats</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['MP4', 'MOV', 'AVI', 'JPG', 'PNG', 'GIF', 'WebM'].map(format => (
                        <Button
                          key={format}
                          type="button"
                          variant={formData.file_formats.includes(format) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFileFormatToggle(format)}
                        >
                          {format}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Additional Notes</Label>
                    <Textarea
                      value={formData.additional_notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                      rows={3}
                      placeholder="Any other specifications or requirements..."
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingId ? 'Update' : 'Submit'} Requirements
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-4">
        {displays.map((display) => {
          const partnerInfo = showAllPartners ? getPartnerInfo(display.partner_email) : null;
          
          return (
            <Card key={display.id} className="border-blue-100">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Badge className={getStatusColor(display.status)}>
                    {display.status.replace(/_/g, ' ')}
                  </Badge>
                  {!showAllPartners && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(display)}
                        className="text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(display.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {showAllPartners && partnerInfo && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-600 font-semibold">Partner</p>
                    <p className="font-semibold text-sm">{partnerInfo.name}</p>
                    <p className="text-xs text-gray-600">{display.partner_email}</p>
                  </div>
                )}
                
                <div className="flex items-start gap-3 mb-3">
                  <Monitor className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg">{display.location_description}</h4>
                    <p className="text-sm text-gray-600">
                      {display.display_type.replace(/_/g, ' ')} • {display.exposure_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm bg-gray-50 p-3 rounded">
                  {(display.width_pixels || display.height_pixels) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dimensions:</span>
                      <span className="font-medium">
                        {display.width_pixels} × {display.height_pixels} px
                      </span>
                    </div>
                  )}
                  {display.aspect_ratio && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Aspect Ratio:</span>
                      <span className="font-medium">{display.aspect_ratio}</span>
                    </div>
                  )}
                  {display.max_file_size_mb && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max File Size:</span>
                      <span className="font-medium">{display.max_file_size_mb} MB</span>
                    </div>
                  )}
                  {display.duration_seconds && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{display.duration_seconds}s</span>
                    </div>
                  )}
                  {display.file_formats && display.file_formats.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Formats:</span>
                      <span className="font-medium">{display.file_formats.join(', ')}</span>
                    </div>
                  )}
                </div>
                
                {display.additional_notes && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-gray-700">
                    <p className="text-xs text-gray-500 mb-1">Notes:</p>
                    {display.additional_notes}
                  </div>
                )}
                
                {display.admin_notes && isAdmin && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                    Admin: {display.admin_notes}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {displays.length === 0 && !isAdding && (
        <Card>
          <CardContent className="p-12 text-center">
            <Monitor className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No display requirements submitted</h3>
            <p className="text-gray-600 mb-6">Add details for screens/billboards where content is needed</p>
            {!showAllPartners && (
              <Button onClick={() => setIsAdding(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add First Display
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}