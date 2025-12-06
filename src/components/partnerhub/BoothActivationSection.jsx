import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Package, Upload } from "lucide-react";

export default function BoothActivationSection({ partnerEmail, isAdmin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    activation_title: "",
    description: "",
    design_files: [],
    booth_size: "",
    power_requirements: "",
    setup_requirements: ""
  });

  const queryClient = useQueryClient();

  const { data: activation } = useQuery({
    queryKey: ['boothActivation', partnerEmail],
    queryFn: async () => {
      const results = await base44.entities.BoothActivation.filter({ partner_email: partnerEmail });
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
      if (activation) {
        return base44.entities.BoothActivation.update(activation.id, data);
      }
      return base44.entities.BoothActivation.create({ ...data, partner_email: partnerEmail });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boothActivation'] });
      setIsEditing(false);
    },
  });

  const handleFileUpload = async (files) => {
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setFormData(prev => ({ ...prev, design_files: [...prev.design_files, ...urls] }));
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

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Booth & Activation Brief</h3>
          <p className="text-sm text-gray-600">Describe your booth design and activation plans</p>
        </div>
        {!isEditing && activation && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Edit
          </Button>
        )}
      </div>

      {(isEditing || !activation) ? (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle>Booth Activation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Activation Title *</Label>
                <Input
                  value={formData.activation_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, activation_title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  placeholder="Describe your booth concept, activities, and activation plans..."
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Booth Size</Label>
                  <Input
                    value={formData.booth_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, booth_size: e.target.value }))}
                    placeholder="e.g., 3m x 3m"
                  />
                </div>
                <div>
                  <Label>Power Requirements</Label>
                  <Input
                    value={formData.power_requirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, power_requirements: e.target.value }))}
                    placeholder="e.g., 220V, 2 outlets"
                  />
                </div>
              </div>

              <div>
                <Label>Setup Requirements</Label>
                <Textarea
                  value={formData.setup_requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, setup_requirements: e.target.value }))}
                  rows={3}
                  placeholder="Special setup needs, furniture, equipment, etc."
                />
              </div>

              <div>
                <Label>Design Files & Visuals</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-gray-500 mt-1">Uploading files...</p>}
                {formData.design_files?.length > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    {formData.design_files.length} file(s) uploaded
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                {activation && (
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={saveMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Activation
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-lg">{activation.activation_title}</h4>
              </div>
              {activation.status && (
                <Badge className={getStatusColor(activation.status)}>
                  {activation.status.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                <p className="text-gray-700 whitespace-pre-wrap">{activation.description}</p>
              </div>

              {(activation.booth_size || activation.power_requirements) && (
                <div className="grid md:grid-cols-2 gap-4 pt-3 border-t">
                  {activation.booth_size && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Booth Size</p>
                      <p className="text-gray-700">{activation.booth_size}</p>
                    </div>
                  )}
                  {activation.power_requirements && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Power Requirements</p>
                      <p className="text-gray-700">{activation.power_requirements}</p>
                    </div>
                  )}
                </div>
              )}

              {activation.setup_requirements && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-600 mb-1">Setup Requirements</p>
                  <p className="text-gray-700">{activation.setup_requirements}</p>
                </div>
              )}

              {activation.design_files?.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-600 mb-2">Design Files ({activation.design_files.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {activation.design_files.map((url, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(url, '_blank')}
                      >
                        View File {index + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!activation && !isEditing && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No booth activation yet</h3>
            <p className="text-gray-600 mb-6">Create your booth activation brief</p>
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Activation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}