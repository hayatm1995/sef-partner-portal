import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Save, MessageSquare, Video } from "lucide-react";

export default function TestimonialSection({ partnerEmail, isAdmin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    testimonial_type: "text",
    content: "",
    video_url: "",
    author_name: "",
    author_title: "",
    permission_to_use: false
  });

  const queryClient = useQueryClient();

  const { data: testimonial } = useQuery({
    queryKey: ['testimonial', partnerEmail],
    queryFn: async () => {
      const results = await base44.entities.Testimonial.filter({ partner_email: partnerEmail });
      if (results[0]) {
        setFormData(results[0]);
        return results[0];
      }
      return null;
    },
    enabled: !!partnerEmail,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (testimonial) {
        return base44.entities.Testimonial.update(testimonial.id, data);
      }
      return base44.entities.Testimonial.create({ ...data, partner_email: partnerEmail });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonial'] });
      setIsEditing(false);
    },
  });

  const handleVideoUpload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, video_url: file_url }));
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Post-Event Testimonial</h3>
          <p className="text-sm text-gray-600">Share your experience and feedback</p>
        </div>
        {!isEditing && testimonial && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Edit
          </Button>
        )}
      </div>

      {(isEditing || !testimonial) ? (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle>Submit Testimonial</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Testimonial Type *</Label>
                <Select
                  value={formData.testimonial_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, testimonial_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.testimonial_type === 'text' ? (
                <div>
                  <Label>Your Testimonial *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    placeholder="Share your experience with the event, what you learned, key takeaways, and any memorable moments..."
                    required
                  />
                </div>
              ) : (
                <div>
                  <Label>Video Testimonial *</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleVideoUpload(e.target.files[0])}
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-gray-500 mt-1">Uploading video...</p>}
                  {formData.video_url && (
                    <p className="text-sm text-green-600 mt-1">✓ Video uploaded successfully</p>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Your Name *</Label>
                  <Input
                    value={formData.author_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Your Title</Label>
                  <Input
                    value={formData.author_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, author_title: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                <Checkbox
                  checked={formData.permission_to_use}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, permission_to_use: checked }))}
                />
                <label className="text-sm">
                  I grant permission to use this testimonial for marketing and promotional purposes
                </label>
              </div>

              <div className="flex gap-3 justify-end">
                {testimonial && (
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={saveMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Submit Testimonial
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              {testimonial.testimonial_type === 'video' ? (
                <Video className="w-6 h-6 text-orange-600" />
              ) : (
                <MessageSquare className="w-6 h-6 text-orange-600" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="capitalize">{testimonial.testimonial_type}</Badge>
                  {testimonial.approved ? (
                    <Badge className="bg-green-100 text-green-800">Approved</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                  )}
                  {testimonial.permission_to_use && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Marketing Approved
                    </Badge>
                  )}
                </div>

                {testimonial.testimonial_type === 'text' ? (
                  <p className="text-gray-700 whitespace-pre-wrap italic">"{testimonial.content}"</p>
                ) : (
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => window.open(testimonial.video_url, '_blank')}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      View Video Testimonial
                    </Button>
                  </div>
                )}

                <div className="mt-4 text-sm">
                  <p className="font-semibold">{testimonial.author_name}</p>
                  {testimonial.author_title && (
                    <p className="text-gray-600">{testimonial.author_title}</p>
                  )}
                </div>
              </div>
            </div>

            {isAdmin && testimonial.admin_notes && (
              <div className="mt-4 p-3 bg-yellow-50 rounded text-sm">
                <p className="font-medium text-gray-700">Admin Notes:</p>
                <p className="text-gray-600">{testimonial.admin_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!testimonial && !isEditing && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No testimonial submitted</h3>
            <p className="text-gray-600 mb-6">Share your experience from the event</p>
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Submit Testimonial
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}