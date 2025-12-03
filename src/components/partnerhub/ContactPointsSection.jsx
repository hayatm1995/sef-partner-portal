import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, User, Mail, Phone, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactPointsSection({ partnerEmail, isAdmin }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    contact_type: "main_poc",
    name: "",
    title: "",
    email: "",
    phone: ""
  });

  const queryClient = useQueryClient();

  const { data: contacts = [] } = useQuery({
    queryKey: ['contactPoints', partnerEmail],
    queryFn: () => base44.entities.ContactPoint.filter({ partner_email: partnerEmail }),
    enabled: !!partnerEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContactPoint.create({ ...data, partner_email: partnerEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactPoints'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContactPoint.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactPoints'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContactPoint.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactPoints'] });
    },
  });

  const resetForm = () => {
    setFormData({
      contact_type: "main_poc",
      name: "",
      title: "",
      email: "",
      phone: ""
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (contact) => {
    setFormData({
      contact_type: contact.contact_type,
      name: contact.name,
      title: contact.title,
      email: contact.email,
      phone: contact.phone
    });
    setEditingId(contact.id);
    setIsAdding(true);
  };

  const getContactTypeLabel = (type) => {
    const labels = {
      main_poc: "Main Point of Contact",
      marketing_poc: "Marketing POC",
      production_poc: "Production POC"
    };
    return labels[type] || type;
  };

  const getContactTypeColor = (type) => {
    const colors = {
      main_poc: "bg-blue-100 text-blue-800",
      marketing_poc: "bg-purple-100 text-purple-800",
      production_poc: "bg-green-100 text-green-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Contact Points</h3>
          <p className="text-sm text-gray-600">Manage your team's contact information</p>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
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
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle>{editingId ? 'Edit' : 'Add'} Contact Point</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Contact Type *</Label>
                    <Select
                      value={formData.contact_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, contact_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main_poc">Main Point of Contact</SelectItem>
                        <SelectItem value="marketing_poc">Marketing POC</SelectItem>
                        <SelectItem value="production_poc">Production POC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingId ? 'Update' : 'Add'} Contact
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact) => (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className="border-orange-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Badge className={getContactTypeColor(contact.contact_type)}>
                    {getContactTypeLabel(contact.contact_type)}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(contact)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(contact.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <p className="font-semibold">{contact.name}</p>
                  </div>
                  {contact.title && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-600" />
                      <p className="text-sm text-gray-600">{contact.title}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-600" />
                    <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline">
                      {contact.email}
                    </a>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <a href={`tel:${contact.phone}`} className="text-sm text-blue-600 hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {contacts.length === 0 && !isAdding && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts added yet</h3>
            <p className="text-gray-600 mb-6">Add your team's contact information to get started</p>
            <Button onClick={() => setIsAdding(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Contact
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}