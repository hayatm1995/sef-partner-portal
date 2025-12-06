import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Save } from "lucide-react";

export default function PRMarketingSection({ partnerEmail, isAdmin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    spokesperson_name_en: "",
    spokesperson_name_ar: "",
    spokesperson_title_en: "",
    spokesperson_title_ar: "",
    pr_quote_en: "",
    pr_quote_ar: "",
    media_contact_preference: ""
  });

  const queryClient = useQueryClient();

  const { data: prData } = useQuery({
    queryKey: ['prMarketing', partnerEmail],
    queryFn: async () => {
      const results = await base44.entities.PRMarketing.filter({ partner_email: partnerEmail });
      if (results[0]) {
        setFormData(results[0]);
      }
      return results[0] || null;
    },
    enabled: !!partnerEmail,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (prData) {
        return base44.entities.PRMarketing.update(prData.id, data);
      }
      return base44.entities.PRMarketing.create({ ...data, partner_email: partnerEmail });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prMarketing'] });
      setIsEditing(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">PR & Marketing Information</h3>
          <p className="text-sm text-gray-600">Manage spokesperson details and PR quotes</p>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
          >
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card className="border-orange-200">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-orange-700">English</h4>
                  <div>
                    <Label>Spokesperson Name</Label>
                    <Input
                      value={formData.spokesperson_name_en}
                      onChange={(e) => setFormData(prev => ({ ...prev, spokesperson_name_en: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Spokesperson Title</Label>
                    <Input
                      value={formData.spokesperson_title_en}
                      onChange={(e) => setFormData(prev => ({ ...prev, spokesperson_title_en: e.target.value }))}
                      placeholder="CEO & Founder"
                    />
                  </div>
                  <div>
                    <Label>PR Quote</Label>
                    <Textarea
                      value={formData.pr_quote_en}
                      onChange={(e) => setFormData(prev => ({ ...prev, pr_quote_en: e.target.value }))}
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
                      value={formData.spokesperson_name_ar}
                      onChange={(e) => setFormData(prev => ({ ...prev, spokesperson_name_ar: e.target.value }))}
                      placeholder="الاسم بالعربي"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label>Spokesperson Title (Arabic)</Label>
                    <Input
                      value={formData.spokesperson_title_ar}
                      onChange={(e) => setFormData(prev => ({ ...prev, spokesperson_title_ar: e.target.value }))}
                      placeholder="المسمى الوظيفي"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label>PR Quote (Arabic)</Label>
                    <Textarea
                      value={formData.pr_quote_ar}
                      onChange={(e) => setFormData(prev => ({ ...prev, pr_quote_ar: e.target.value }))}
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
                  value={formData.media_contact_preference}
                  onChange={(e) => setFormData(prev => ({ ...prev, media_contact_preference: e.target.value }))}
                  placeholder="Preferred way to be contacted by media..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
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
              {formData.spokesperson_name_en ? (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Spokesperson</p>
                    <p className="font-semibold">{formData.spokesperson_name_en}</p>
                    {formData.spokesperson_title_en && (
                      <p className="text-sm text-gray-600">{formData.spokesperson_title_en}</p>
                    )}
                  </div>
                  {formData.pr_quote_en && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">PR Quote</p>
                      <p className="text-gray-700 italic">"{formData.pr_quote_en}"</p>
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
              {formData.spokesperson_name_ar ? (
                <div dir="rtl">
                  <div>
                    <p className="text-sm text-gray-600">المتحدث الرسمي</p>
                    <p className="font-semibold">{formData.spokesperson_name_ar}</p>
                    {formData.spokesperson_title_ar && (
                      <p className="text-sm text-gray-600">{formData.spokesperson_title_ar}</p>
                    )}
                  </div>
                  {formData.pr_quote_ar && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">اقتباس العلاقات العامة</p>
                      <p className="text-gray-700 italic">"{formData.pr_quote_ar}"</p>
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

      {formData.media_contact_preference && !isEditing && (
        <Card className="border-purple-100 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg">Media Contact Preference</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{formData.media_contact_preference}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}