import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, Users, Mail, Phone, Building, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SpeakersSection({ partnerEmail, isAdmin }) {
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    speaker_name: "",
    speaker_bio: "",
    speaker_title: "",
    speaker_company: "",
    speaker_email: "",
    speaker_phone: "",
    headshot_url: "",
    topic_expertise: ""
  });

  const queryClient = useQueryClient();

  const { data: speakers = [] } = useQuery({
    queryKey: ['speakers', partnerEmail],
    queryFn: () => base44.entities.SpeakerNomination.filter({ partner_email: partnerEmail }),
    enabled: !!partnerEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SpeakerNomination.create({ ...data, partner_email: partnerEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speakers'] });
      setIsAdding(false);
      setFormData({
        speaker_name: "",
        speaker_bio: "",
        speaker_title: "",
        speaker_company: "",
        speaker_email: "",
        speaker_phone: "",
        headshot_url: "",
        topic_expertise: ""
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SpeakerNomination.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['speakers'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleHeadshotUpload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, headshot_url: file_url }));
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Speaker Nominations</h3>
          <p className="text-sm text-gray-600">Nominate speakers for event sessions and panels</p>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Speaker
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
                <CardTitle>Nominate Speaker</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Speaker Name *</Label>
                      <Input
                        value={formData.speaker_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, speaker_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label>Title/Position</Label>
                      <Input
                        value={formData.speaker_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, speaker_title: e.target.value }))}
                        placeholder="e.g., CEO, Founder"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={formData.speaker_company}
                        onChange={(e) => setFormData(prev => ({ ...prev, speaker_company: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={formData.speaker_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, speaker_email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      value={formData.speaker_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, speaker_phone: e.target.value }))}
                      placeholder="+971 XX XXX XXXX"
                    />
                  </div>

                  <div>
                    <Label>Biography</Label>
                    <Textarea
                      value={formData.speaker_bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, speaker_bio: e.target.value }))}
                      rows={4}
                      placeholder="Professional background, achievements, and experience..."
                    />
                  </div>

                  <div>
                    <Label>Topic Expertise</Label>
                    <Textarea
                      value={formData.topic_expertise}
                      onChange={(e) => setFormData(prev => ({ ...prev, topic_expertise: e.target.value }))}
                      rows={3}
                      placeholder="Speaking topics, areas of expertise, and past speaking experience..."
                    />
                  </div>

                  <div>
                    <Label>Headshot Photo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleHeadshotUpload(e.target.files[0])}
                      disabled={uploading}
                    />
                    {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                    {formData.headshot_url && (
                      <p className="text-sm text-green-600 mt-1">✓ Photo uploaded successfully</p>
                    )}
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      Submit Speaker
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {speakers.map((speaker) => (
          <motion.div
            key={speaker.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-orange-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Badge className={getStatusColor(speaker.status)}>
                    {speaker.status.replace(/_/g, ' ')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(speaker.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {speaker.headshot_url && (
                  <div className="mb-4">
                    <img
                      src={speaker.headshot_url}
                      alt={speaker.speaker_name}
                      className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-orange-100"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-semibold text-lg text-center">{speaker.speaker_name}</h4>
                  
                  {speaker.speaker_title && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 justify-center">
                      <User className="w-4 h-4" />
                      <span>{speaker.speaker_title}</span>
                    </div>
                  )}
                  
                  {speaker.speaker_company && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 justify-center">
                      <Building className="w-4 h-4" />
                      <span>{speaker.speaker_company}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${speaker.speaker_email}`} className="text-blue-600 hover:underline truncate">
                        {speaker.speaker_email}
                      </a>
                    </div>
                    
                    {speaker.speaker_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${speaker.speaker_phone}`} className="text-blue-600 hover:underline">
                          {speaker.speaker_phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {speaker.speaker_bio && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-600 mb-1">Bio:</p>
                      <p className="text-sm text-gray-700 line-clamp-3">{speaker.speaker_bio}</p>
                    </div>
                  )}

                  {speaker.topic_expertise && (
                    <div className="pt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Expertise:</p>
                      <p className="text-sm text-gray-700 line-clamp-2">{speaker.topic_expertise}</p>
                    </div>
                  )}

                  {speaker.admin_notes && isAdmin && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                      <p className="font-medium">Admin Notes:</p>
                      <p>{speaker.admin_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {speakers.length === 0 && !isAdding && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No speakers nominated yet</h3>
            <p className="text-gray-600 mb-6">Nominate industry experts and thought leaders for event sessions</p>
            <Button onClick={() => setIsAdding(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Speaker
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}