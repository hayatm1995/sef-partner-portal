import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { Plus, Trash2, IdCard, AlertCircle, Ticket, Users, Upload, FileSpreadsheet, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function BadgeRegistrationSection({ partnerEmail, isAdmin, showAllPartners }) {
  const [activeCategory, setActiveCategory] = useState("exhibitor_ticket");
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    attendee_name: "",
    attendee_email: "",
    company_name: "",
    job_title: "",
    gender: "",
    date_of_birth: "",
    attendee_phone: ""
  });

  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['partnerProfile', partnerEmail],
    queryFn: async () => {
      if (!partnerEmail || showAllPartners) return null;
      const profiles = await base44.entities.PartnerProfile.filter({ partner_email: partnerEmail });
      return profiles[0] || null;
    },
    enabled: !!partnerEmail && !showAllPartners
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ['badgeRegistrations', partnerEmail, showAllPartners],
    queryFn: () => {
      if (showAllPartners) {
        return base44.entities.BadgeRegistration.list('-created_date');
      }
      return base44.entities.BadgeRegistration.filter({ partner_email: partnerEmail });
    },
    enabled: !!partnerEmail || showAllPartners
  });

  const exhibitorTickets = allBadges.filter((b) => b.badge_category === 'exhibitor_ticket');
  const belongPasses = allBadges.filter((b) => b.badge_category === 'belong_pass');

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BadgeRegistration.create({
      ...data,
      partner_email: partnerEmail,
      badge_category: activeCategory
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badgeRegistrations'] });
      setIsAdding(false);
      setFormData({
        attendee_name: "",
        attendee_email: "",
        company_name: "",
        job_title: "",
        gender: "",
        date_of_birth: "",
        attendee_phone: ""
      });
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (records) => {
      const results = [];
      for (const record of records) {
        try {
          const result = await base44.entities.BadgeRegistration.create({
            ...record,
            partner_email: partnerEmail,
            badge_category: activeCategory
          });
          results.push({ success: true, data: result });
        } catch (error) {
          results.push({ success: false, error: error.message, record });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['badgeRegistrations'] });
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (failCount > 0) {
        toast.warning(`${successCount} registrations created, ${failCount} failed due to missing mandatory fields`);
      } else {
        toast.success(`✅ ${successCount} badge registrations created successfully!`);
      }

      setIsBulkUploading(false);
      setBulkFile(null);
      setIsProcessing(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BadgeRegistration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badgeRegistrations'] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleBulkUpload = async (file) => {
    if (!file) return;

    setIsProcessing(true);

    try {
      // Upload file first
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract data from file using Core integration
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            registrations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  attendee_name: { type: "string" },
                  attendee_email: { type: "string" },
                  company_name: { type: "string" },
                  job_title: { type: "string" },
                  gender: { type: "string" },
                  date_of_birth: { type: "string" },
                  attendee_phone: { type: "string" }
                },
                required: ["attendee_name", "attendee_email", "company_name", "job_title", "gender"]
              }
            }
          }
        }
      });

      if (extractResult.status === "error") {
        toast.error(`Failed to process file: ${extractResult.details}`);
        setIsProcessing(false);
        return;
      }

      const records = extractResult.output?.registrations || extractResult.output || [];

      if (records.length === 0) {
        toast.error("No valid records found in file");
        setIsProcessing(false);
        return;
      }

      // Validate mandatory fields
      const validRecords = records.filter((record) => {
        return record.attendee_name &&
        record.attendee_email &&
        record.company_name &&
        record.job_title &&
        record.gender;
      });

      if (validRecords.length < records.length) {
        const rejected = records.length - validRecords.length;
        toast.warning(`${rejected} record(s) rejected due to missing mandatory fields`);
      }

      if (validRecords.length === 0) {
        toast.error("All records were rejected. Please ensure all mandatory fields are filled.");
        setIsProcessing(false);
        return;
      }

      // Create bulk registrations
      await bulkCreateMutation.mutateAsync(validRecords);

    } catch (error) {
      toast.error(`Error processing file: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `attendee_name,attendee_email,company_name,job_title,gender,date_of_birth,attendee_phone
John Smith,john@company.com,ABC Company,Marketing Manager,male,1990-01-15,+971501234567
Jane Doe,jane@company.com,ABC Company,Sales Director,female,1985-05-20,+971507654321`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'badge_registration_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success('Template downloaded!');
  };

  const exhibitorAllocation = profile?.exhibitor_tickets_allocation || 0;
  const belongAllocation = profile?.belong_passes_allocation || 0;

  const canAddExhibitor = exhibitorTickets.length < exhibitorAllocation;
  const canAddBelong = belongPasses.length < belongAllocation;

  const exhibitorProgress = exhibitorAllocation > 0 ? exhibitorTickets.length / exhibitorAllocation * 100 : 0;
  const belongProgress = belongAllocation > 0 ? belongPasses.length / belongAllocation * 100 : 0;

  if (showAllPartners) {
    return (
      <div className="space-y-6">
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 mx-auto text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Admin View - All Badge Registrations</h3>
            <p className="text-sm text-gray-600 mb-4">
              Viewing badge registrations from all partners
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Sponsor EXHIBITOR Passes</p>
                <p className="text-3xl font-bold text-orange-600">{exhibitorTickets.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total SPONSOR Passes</p>
                <p className="text-3xl font-bold text-blue-600">{belongPasses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="exhibitor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="exhibitor">
              <Ticket className="w-4 h-4 mr-2" />
              Exhibitor Tickets ({exhibitorTickets.length})
            </TabsTrigger>
            <TabsTrigger value="belong">
              <IdCard className="w-4 h-4 mr-2" />
              Sponsor Passes ({belongPasses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exhibitor">
            <BadgeList badges={exhibitorTickets} deleteMutation={deleteMutation} showPartnerEmail />
          </TabsContent>

          <TabsContent value="belong">
            <BadgeList badges={belongPasses} deleteMutation={deleteMutation} showPartnerEmail />
          </TabsContent>
        </Tabs>
      </div>);

  }

  return (
    <div className="space-y-6">
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exhibitor_ticket">
            <Ticket className="w-4 h-4 mr-2" />
            Exhibitor Tickets
          </TabsTrigger>
          <TabsTrigger value="belong_pass">
            <IdCard className="w-4 h-4 mr-2" />
            Sponsor Passes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exhibitor_ticket" className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Exhibitor Tickets</h3>
                <p className="text-sm text-gray-600">
                  Register team members for exhibitor access (Max {exhibitorAllocation})
                </p>
              </div>
              <div className="flex gap-2">
                {canAddExhibitor && !isAdding && !isBulkUploading &&
                <>
                    <Button
                    onClick={() => setIsBulkUploading(true)}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50">

                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Upload
                    </Button>
                    <Button
                    onClick={() => setIsAdding(true)}
                    className="bg-gradient-to-r from-orange-500 to-amber-600">

                      <Plus className="w-4 h-4 mr-2" />
                      Add Single
                    </Button>
                  </>
                }
              </div>
            </div>

            <Card className="border-orange-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Registration Progress</span>
                  <span className="text-sm font-bold">{exhibitorTickets.length}/{exhibitorAllocation}</span>
                </div>
                <Progress value={exhibitorProgress} className="h-2" />
              </CardContent>
            </Card>

            {!canAddExhibitor && !isAdding &&
            <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Maximum exhibitor ticket limit reached. Contact your account manager if you need more.
                  </p>
                </CardContent>
              </Card>
            }
          </div>

          {isBulkUploading &&
          <BulkUploadForm
            onUpload={handleBulkUpload}
            onCancel={() => {
              setIsBulkUploading(false);
              setBulkFile(null);
            }}
            isProcessing={isProcessing}
            badgeType="Exhibitor Ticket"
            onDownloadTemplate={downloadTemplate} />

          }

          {isAdding &&
          <BadgeForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => setIsAdding(false)}
            isLoading={createMutation.isPending}
            badgeType="Exhibitor Ticket" />

          }

          <BadgeList
            badges={exhibitorTickets}
            deleteMutation={deleteMutation}
            onAddClick={() => setIsAdding(true)}
            isEmpty={exhibitorTickets.length === 0 && !isAdding && !isBulkUploading} />

        </TabsContent>

        <TabsContent value="belong_pass" className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Sponsor Passes</h3>
                <p className="text-sm text-gray-600">
                  Register team members for sponsor pass access (Max {belongAllocation})
                </p>
              </div>
              <div className="flex gap-2">
                {canAddBelong && !isAdding && !isBulkUploading &&
                <>
                    <Button
                    onClick={() => setIsBulkUploading(true)}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50">

                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Upload
                    </Button>
                    <Button
                    onClick={() => setIsAdding(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600">

                      <Plus className="w-4 h-4 mr-2" />
                      Add Single
                    </Button>
                  </>
                }
              </div>
            </div>

            <Card className="border-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Registration Progress</span>
                  <span className="text-sm font-bold">{belongPasses.length}/{belongAllocation}</span>
                </div>
                <Progress value={belongProgress} className="h-2" />
              </CardContent>
            </Card>

            {!canAddBelong && !isAdding &&
            <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Maximum sponsor pass limit reached. Contact your account manager if you need more.
                  </p>
                </CardContent>
              </Card>
            }
          </div>

          {isBulkUploading &&
          <BulkUploadForm
            onUpload={handleBulkUpload}
            onCancel={() => {
              setIsBulkUploading(false);
              setBulkFile(null);
            }}
            isProcessing={isProcessing}
            badgeType="Sponsor Pass"
            onDownloadTemplate={downloadTemplate} />

          }

          {isAdding &&
          <BadgeForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => setIsAdding(false)}
            isLoading={createMutation.isPending}
            badgeType="Sponsor Pass" />

          }

          <BadgeList
            badges={belongPasses}
            deleteMutation={deleteMutation}
            onAddClick={() => setIsAdding(true)}
            isEmpty={belongPasses.length === 0 && !isAdding && !isBulkUploading} />

        </TabsContent>
      </Tabs>
    </div>);

}

function BulkUploadForm({ onUpload, onCancel, isProcessing, badgeType, onDownloadTemplate }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['.csv', '.xlsx', '.xls'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!validTypes.includes(fileExt)) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Bulk Upload {badgeType} Registrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-2">⚠️ Important: Mandatory Fields</p>
                  <p className="text-sm text-red-800 mb-2">
                    All registrations MUST include the following fields, or they will be rejected:
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-800 space-y-1 ml-2">
                    <li><strong>Full Name</strong> (attendee_name)</li>
                    <li><strong>Email</strong> (attendee_email)</li>
                    <li><strong>Company Name</strong> (company_name)</li>
                    <li><strong>Job Title</strong> (job_title)</li>
                    <li><strong>Gender</strong> (gender: male/female/prefer_not_to_say)</li>
                  </ul>
                  <p className="text-xs text-red-700 mt-2 italic">
                    Optional fields: date_of_birth, attendee_phone
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Download CSV Template</p>
                <p className="text-xs text-blue-700">Pre-formatted template with all required fields</p>
              </div>
            </div>
            <Button
              onClick={onDownloadTemplate}
              variant="outline"
              size="sm"
              className="border-blue-600 text-blue-600 hover:bg-blue-100">

              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Upload CSV or Excel File</Label>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="mt-2" />

              {selectedFile &&
              <p className="text-sm text-green-600 mt-2">
                  ✓ Selected: {selectedFile.name}
                </p>
              }
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}>

                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFile || isProcessing}
                className="bg-green-600 hover:bg-green-700">

                {isProcessing ?
                <>Processing...</> :

                <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Process
                  </>
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>);

}

function BadgeForm({ formData, setFormData, onSubmit, onCancel, isLoading, badgeType }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}>

      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle>Register {badgeType}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.attendee_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, attendee_name: e.target.value }))}
                  placeholder="John Smith"
                  required />

              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.attendee_email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, attendee_email: e.target.value }))}
                  placeholder="john@company.com"
                  required />

              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, company_name: e.target.value }))}
                  placeholder="ABC Company"
                  required />

              </div>
              <div>
                <Label>Job Title *</Label>
                <Input
                  value={formData.job_title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, job_title: e.target.value }))}
                  placeholder="Marketing Manager"
                  required />

              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                  required>

                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))} />

              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={formData.attendee_phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, attendee_phone: e.target.value }))}
                  placeholder="+971 XX XXX XXXX" />

              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Register'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>);

}

function BadgeList({ badges, deleteMutation, onAddClick, isEmpty, showPartnerEmail }) {
  if (isEmpty) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <IdCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No badges registered yet</h3>
          <p className="text-gray-600 mb-6">Register your team members to get event badges</p>
          <Button onClick={onAddClick} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Register First Team Member
          </Button>
        </CardContent>
      </Card>);

  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {badges.map((badge, index) =>
      <motion.div
        key={badge.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}>

          <Card className="border-orange-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <IdCard className="w-5 h-5 text-orange-600" />
                  <Badge variant="outline">#{index + 1}</Badge>
                  {badge.badge_category === 'exhibitor_ticket' &&
                <Badge className="bg-orange-100 text-orange-800">Exhibitor</Badge>
                }
                  {badge.badge_category === 'belong_pass' &&
                <Badge className="bg-blue-100 text-blue-800">Sponsor</Badge>
                }
                </div>
                <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate(badge.id)}
                className="text-red-600">

                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-lg">{badge.attendee_name}</p>
                {showPartnerEmail &&
              <p className="text-xs text-gray-500">Partner: {badge.partner_email}</p>
              }
                <p className="text-sm text-gray-600">{badge.company_name}</p>
                {badge.job_title &&
              <p className="text-sm text-gray-600">{badge.job_title}</p>
              }
                <p className="text-sm text-blue-600">{badge.attendee_email}</p>
                {badge.attendee_phone &&
              <p className="text-sm text-gray-600">{badge.attendee_phone}</p>
              }
                {badge.gender &&
              <p className="text-xs text-gray-500">
                    Gender: {badge.gender === 'prefer_not_to_say' ? 'Prefer not to say' : badge.gender.charAt(0).toUpperCase() + badge.gender.slice(1)}
                  </p>
              }
                {badge.date_of_birth &&
              <p className="text-xs text-gray-500">DOB: {new Date(badge.date_of_birth).toLocaleDateString()}</p>
              }
                <Badge className={badge.status === 'collected' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {badge.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>);

}