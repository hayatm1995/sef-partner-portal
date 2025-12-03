import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Save, MessageSquare, Video, Upload } from "lucide-react";

export default function PRMarketingTestimonialSection({ partnerEmail, isAdmin }) {
  const [activeTab, setActiveTab] = useState("pr");
  const [isEditingPR, setIsEditingPR] = useState(false);
  const [isEditingTestimonial, setIsEditingTestimonial] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [prData, setPRData] = useState({
    spokesperson_name_en: "",
    spokesperson_name_ar: "",
    spokesperson_title_en: "",
    spokesperson_title_ar: "",
    pr_quote_en: "",
    pr_quote_ar: "",
    media_contact_preference: ""
  });

  const [testimonialData, setTestimonialData] = useState({
    testimonial_type: "text",
    content: "",
    video_url: "",
    author_name: "",
    author_title: "",
    permission_to_use: false
  });

  const queryClient = useQueryClient();

  const { data: prRecord } = useQuery({
    queryKey: ['prMarketing', partnerEmail],
    queryFn: async () => {
      const results = await base44.entities.PRMarketing.filter({ partner_email: partnerEmail });
      if (results[0]) {
        setPRData(results[0]);
      }
      return results[0] || null;
    },
    enabled: !!partnerEmail,
  });

  const { data: testimonial } = useQuery({
    queryKey: ['testimonial', partnerEmail],
    queryFn: async () => {
      const results = await base44.entities.Testimonial.filter({ partner_email: partnerEmail });
      if (results[0]) {
        setTestimonialData(results[0]);
        return results[0];
      }
      return null;
    },
    enabled: !!partnerEmail,
  });

  const savePRMutation = useMutation({
    mutationFn: (data) => {
      if (prRecord) {
        return base44.entities.PRMarketing.update(prRecord.id, data);
      }
      return base44.entities.PRMarketing.create({ ...data, partner_email: partnerEmail });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prMarketing'] });
      setIsEditingPR(false);
    },
  });

  const saveTestimonialMutation = useMutation({
    mutationFn: (data) => {
      if (testimonial) {
        return base44.entities.Testimonial.update(testimonial.id, data);
      }
      return base44.entities.Testimonial.create({ ...data, partner_email: partnerEmail });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonial'] });
      setIsEditingTestimonial(false);
    },
  });

  const handlePRSubmit = (e) => {
    e.preventDefault();
    savePRMutation.mutate(prData);
  };

  const handleTestimonialSubmit = (e) => {
    e.preventDefault();
    saveTestimonialMutation.mutate(testimonialData);
  };

  const handleVideoUpload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setTestimonialData(prev => ({ ...prev, video_url: file_url }));
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">PR, Marketing & Testimonials</h3>
        <p className="text-gray-600">Manage your spokesperson information and share your experience</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pr" className="gap-2">
            <Megaphone className="w-4 h-4" />
            PR & Marketing
          </TabsTrigger>
          <TabsTrigger value="testimonial" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Testimonial
          </TabsTrigger>
        </TabsList>

        {/* PR & Marketing Tab */}
        <TabsContent value="pr" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Manage spokesperson details and PR quotes</p>
            {!isEditingPR && (
              <Button onClick={() => setIsEditingPR(true)} variant="outline">
                Edit
              </Button>
            )}
          </div>

          {isEditingPR ? (
            <Card className="border-orange-200">
              <CardContent className="p-6">
                <form onSubmit={handlePRSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-orange-700">English</h4>
                      <div>
                        <Label>Spokesperson Name</Label>
                        <Input
                          value={prData.spokesperson_name_en}
                          onChange={(e) => setPRData(prev => ({ ...prev, spokesperson_name_en: e.target.value }))}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label>Spokesperson Title</Label>
                        <Input
                          value={prData.spokesperson_title_en}
                          onChange={(e) => setPRData(prev => ({ ...prev, spokesperson_title_en: e.target.value }))}
                          placeholder="CEO & Founder"
                        />
                      </div>
                      <div>
                        <Label>PR Quote</Label>
                        <Textarea
                          value={prData.pr_quote_en}
                          onChange={(e) => setPRData(prev => ({ ...prev, pr_quote_en: e.target.value }))}
                          placeholder="Your PR quote in English..."
                          rows={5}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-orange-700">Arabic</h4>
                      <div>
                        <Label>Spokesperson Name (Arabic)</Label>
                        <Input
                          value={prData.spokesperson_name_ar}
                          onChange={(e) => setPRData(prev => ({ ...prev, spokesperson_name_ar: e.target.value }))}
                          placeholder="الاسم بالعربي"
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <Label>Spokesperson Title (Arabic)</Label>
                        <Input
                          value={prData.spokesperson_title_ar}
                          onChange={(e) => setPRData(prev => ({ ...prev, spokesperson_title_ar: e.target.value }))}
                          placeholder="المسمى الوظيفي"
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <Label>PR Quote (Arabic)</Label>
                        <Textarea
                          value={prData.pr_quote_ar}
                          onChange={(e) => setPRData(prev => ({ ...prev, pr_quote_ar: e.target.value }))}
                          placeholder="اقتباس العلاقات العامة بالعربية..."
                          rows={5}
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Media Contact Preference</Label>
                    <Textarea
                      value={prData.media_contact_preference}
                      onChange={(e) => setPRData(prev => ({ ...prev, media_contact_preference: e.target.value }))}
                      placeholder="Preferred way to be contacted by media..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsEditingPR(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={savePRMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-blue-100">
                <CardHeader>
                  <CardTitle className="text-lg">English Version</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {prData.spokesperson_name_en ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Spokesperson</p>
                        <p className="font-semibold">{prData.spokesperson_name_en}</p>
                        {prData.spokesperson_title_en && (
                          <p className="text-sm text-gray-600">{prData.spokesperson_title_en}</p>
                        )}
                      </div>
                      {prData.pr_quote_en && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">PR Quote</p>
                          <p className="text-gray-700 italic">"{prData.pr_quote_en}"</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No English content added yet</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-blue-100">
                <CardHeader>
                  <CardTitle className="text-lg">Arabic Version</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {prData.spokesperson_name_ar ? (
                    <div dir="rtl">
                      <div>
                        <p className="text-sm text-gray-600">المتحدث الرسمي</p>
                        <p className="font-semibold">{prData.spokesperson_name_ar}</p>
                        {prData.spokesperson_title_ar && (
                          <p className="text-sm text-gray-600">{prData.spokesperson_title_ar}</p>
                        )}
                      </div>
                      {prData.pr_quote_ar && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">اقتباس العلاقات العامة</p>
                          <p className="text-gray-700 italic">"{prData.pr_quote_ar}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">لم يتم إضافة محتوى عربي بعد</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {prData.media_contact_preference && !isEditingPR && (
            <Card className="border-purple-100 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-lg">Media Contact Preference</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{prData.media_contact_preference}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Testimonial Tab */}
        <TabsContent value="testimonial" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Share your experience and feedback</p>
            {!isEditingTestimonial && testimonial && (
              <Button onClick={() => setIsEditingTestimonial(true)} variant="outline">
                Edit
              </Button>
            )}
          </div>

          {(isEditingTestimonial || !testimonial) ? (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle>Submit Testimonial</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTestimonialSubmit} className="space-y-4">
                  <div>
                    <Label>Testimonial Type *</Label>
                    <Select
                      value={testimonialData.testimonial_type}
                      onValueChange={(value) => setTestimonialData(prev => ({ ...prev, testimonial_type: value }))}
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

                  {testimonialData.testimonial_type === 'text' ? (
                    <div>
                      <Label>Your Testimonial *</Label>
                      <Textarea
                        value={testimonialData.content}
                        onChange={(e) => setTestimonialData(prev => ({ ...prev, content: e.target.value }))}
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
                      {testimonialData.video_url && (
                        <p className="text-sm text-green-600 mt-1">✓ Video uploaded successfully</p>
                      )}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Your Name *</Label>
                      <Input
                        value={testimonialData.author_name}
                        onChange={(e) => setTestimonialData(prev => ({ ...prev, author_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label>Your Title</Label>
                      <Input
                        value={testimonialData.author_title}
                        onChange={(e) => setTestimonialData(prev => ({ ...prev, author_title: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                    <Checkbox
                      checked={testimonialData.permission_to_use}
                      onCheckedChange={(checked) => setTestimonialData(prev => ({ ...prev, permission_to_use: checked }))}
                    />
                    <label className="text-sm">
                      I grant permission to use this testimonial for marketing and promotional purposes
                    </label>
                  </div>

                  <div className="flex gap-3 justify-end">
                    {testimonial && (
                      <Button type="button" variant="outline" onClick={() => setIsEditingTestimonial(false)}>
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" disabled={saveTestimonialMutation.isPending}>
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

          {!testimonial && !isEditingTestimonial && (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No testimonial submitted</h3>
                <p className="text-gray-600 mb-6">Share your experience from the event</p>
                <Button onClick={() => setIsEditingTestimonial(true)} variant="outline">
                  Submit Testimonial
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}