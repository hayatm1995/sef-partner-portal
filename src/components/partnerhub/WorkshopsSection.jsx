import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function WorkshopsSection({ partnerEmail, isAdmin, showAllPartners }) {
  const [isAddingWorkshop, setIsAddingWorkshop] = useState(false);

  const [workshopForm, setWorkshopForm] = useState({
    workshop_title: "",
    instructor_name: "",
    instructor_bio: "",
    instructor_contact: "",
    description: "",
    duration_minutes: 60,
    max_participants: 30,
    arrangement_type: "we_will_arrange",
    contact_person: "",
    contact_email: ""
  });

  const queryClient = useQueryClient();

  const { data: workshops = [] } = useQuery({
    queryKey: ['workshops', partnerEmail, showAllPartners],
    queryFn: async () => {
      if (showAllPartners) {
        return await base44.entities.WorkshopNomination.list('-created_date');
      }
      return await base44.entities.WorkshopNomination.filter({ partner_email: partnerEmail });
    },
    enabled: !!partnerEmail || showAllPartners,
  });

  const createWorkshopMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkshopNomination.create({ ...data, partner_email: partnerEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast.success('Workshop submitted successfully! 🎉');
      setIsAddingWorkshop(false);
      setWorkshopForm({
        workshop_title: "",
        instructor_name: "",
        instructor_bio: "",
        instructor_contact: "",
        description: "",
        duration_minutes: 60,
        max_participants: 30,
        arrangement_type: "we_will_arrange",
        contact_person: "",
        contact_email: ""
      });
    },
    onError: (error) => {
      toast.error(`Failed to submit workshop: ${error.message}`);
    }
  });

  const deleteWorkshopMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkshopNomination.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workshops'] }),
  });

  const handleWorkshopSubmit = (e) => {
    e.preventDefault();
    createWorkshopMutation.mutate(workshopForm);
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800"
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
          <h3 className="text-lg font-semibold">Sponsored Workshops</h3>
          <p className="text-sm text-gray-600">
            {showAllPartners ? 'View all workshop submissions from partners' : 'Submit sponsored workshop proposals'}
          </p>
        </div>
        {!isAddingWorkshop && !showAllPartners && (
          <Button
            onClick={() => setIsAddingWorkshop(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Workshop
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isAddingWorkshop && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle>Submit Sponsored Workshop</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWorkshopSubmit} className="space-y-4">
                  <div>
                    <Label>Workshop Title *</Label>
                    <Input
                      value={workshopForm.workshop_title}
                      onChange={(e) => setWorkshopForm(prev => ({ ...prev, workshop_title: e.target.value }))}
                      placeholder="e.g., AI in Business, Marketing Strategies..."
                      required
                    />
                  </div>

                  <div>
                    <Label>Workshop Description *</Label>
                    <Textarea
                      value={workshopForm.description}
                      onChange={(e) => setWorkshopForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      placeholder="Brief description of the workshop content and objectives..."
                      required
                    />
                  </div>

                  <div>
                    <Label>Instructor Name *</Label>
                    <Input
                      value={workshopForm.instructor_name}
                      onChange={(e) => setWorkshopForm(prev => ({ ...prev, instructor_name: e.target.value }))}
                      placeholder="Full name of the workshop instructor"
                      required
                    />
                  </div>

                  <div>
                    <Label>Instructor Bio</Label>
                    <Textarea
                      value={workshopForm.instructor_bio}
                      onChange={(e) => setWorkshopForm(prev => ({ ...prev, instructor_bio: e.target.value }))}
                      rows={3}
                      placeholder="Brief biography of the instructor..."
                    />
                  </div>

                  <div>
                    <Label>Instructor Contact</Label>
                    <Input
                      type="email"
                      value={workshopForm.instructor_contact}
                      onChange={(e) => setWorkshopForm(prev => ({ ...prev, instructor_contact: e.target.value }))}
                      placeholder="instructor@email.com"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Duration (minutes) *</Label>
                      <Input
                        type="number"
                        value={workshopForm.duration_minutes}
                        onChange={(e) => setWorkshopForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                        placeholder="60"
                        required
                      />
                    </div>
                    <div>
                      <Label>Max Participants *</Label>
                      <Input
                        type="number"
                        value={workshopForm.max_participants}
                        onChange={(e) => setWorkshopForm(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 0 }))}
                        placeholder="30"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Arrangement Type *</Label>
                    <Select
                      value={workshopForm.arrangement_type}
                      onValueChange={(value) => setWorkshopForm(prev => ({ ...prev, arrangement_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="we_will_arrange">We will arrange everything ourselves</SelectItem>
                        <SelectItem value="please_arrange">Please arrange everything for us</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose if you'll handle the workshop logistics or if Sheraa should arrange it
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Person</Label>
                      <Input
                        value={workshopForm.contact_person}
                        onChange={(e) => setWorkshopForm(prev => ({ ...prev, contact_person: e.target.value }))}
                        placeholder="Your name or coordinator name"
                      />
                    </div>
                    <div>
                      <Label>Contact Email</Label>
                      <Input
                        type="email"
                        value={workshopForm.contact_email}
                        onChange={(e) => setWorkshopForm(prev => ({ ...prev, contact_email: e.target.value }))}
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsAddingWorkshop(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createWorkshopMutation.isPending}>
                      {createWorkshopMutation.isPending ? 'Submitting...' : 'Submit Workshop'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-4">
        {workshops.map((workshop) => {
          const partnerInfo = showAllPartners ? getPartnerInfo(workshop.partner_email) : null;
          
          return (
            <Card key={workshop.id} className="border-orange-100">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Badge className={getStatusColor(workshop.status)}>
                    {workshop.status.replace(/_/g, ' ')}
                  </Badge>
                  {!showAllPartners && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteWorkshopMutation.mutate(workshop.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                {showAllPartners && partnerInfo && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-600 font-semibold">Submitted by</p>
                    <p className="font-semibold text-sm">{partnerInfo.name}</p>
                    <p className="text-xs text-gray-600">{workshop.partner_email}</p>
                  </div>
                )}
                
                <h4 className="font-semibold text-lg mb-2">{workshop.workshop_title}</h4>
                <p className="text-sm text-gray-700 mb-3">{workshop.description}</p>
                
                {workshop.instructor_name && (
                  <div className="mb-3 p-2 bg-blue-50 rounded">
                    <p className="text-xs font-semibold text-blue-900">Instructor</p>
                    <p className="text-sm font-medium">{workshop.instructor_name}</p>
                    {workshop.instructor_contact && (
                      <p className="text-xs text-gray-600">{workshop.instructor_contact}</p>
                    )}
                  </div>
                )}
                
                {(workshop.duration_minutes || workshop.max_participants) && (
                  <div className="flex gap-2 mb-2">
                    {workshop.duration_minutes && (
                      <Badge variant="outline">⏱️ {workshop.duration_minutes} min</Badge>
                    )}
                    {workshop.max_participants && (
                      <Badge variant="outline">👥 Max {workshop.max_participants}</Badge>
                    )}
                  </div>
                )}
                
                {workshop.arrangement_type && (
                  <Badge variant="outline" className="mb-2">
                    {workshop.arrangement_type === 'we_will_arrange' ? '✓ Self-Arranged' : '⚙️ Sheraa to Arrange'}
                  </Badge>
                )}
                
                {(workshop.contact_person || workshop.contact_email) && (
                  <div className="mt-2 text-xs text-gray-600">
                    {workshop.contact_person && <p>Contact: {workshop.contact_person}</p>}
                    {workshop.contact_email && <p>Email: {workshop.contact_email}</p>}
                  </div>
                )}
                
                {workshop.admin_notes && isAdmin && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                    Admin: {workshop.admin_notes}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {workshops.length === 0 && !isAddingWorkshop && (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No sponsored workshops submitted</h3>
            <p className="text-gray-600 mb-6">Submit your sponsored workshop proposals</p>
            <Button onClick={() => setIsAddingWorkshop(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Workshop
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}