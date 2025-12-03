
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import RequirementDialog from "../components/admin/RequirementDialog";

export default function AdminRequirements() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.PartnerRequirement.list('-display_order'),
    enabled: user?.role === 'admin',
  });

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role !== 'admin');
    },
    enabled: user?.role === 'admin',
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PartnerRequirement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive, requirement }) => {
      const updated = await base44.entities.PartnerRequirement.update(id, { is_active: isActive });
      
      // Notify partners when requirement is activated
      if (isActive && !requirement.is_active) {
        const partnersToNotifyEmails = requirement.applies_to_partner_emails?.length > 0 
          ? requirement.applies_to_partner_emails 
          : allPartners.filter(p => p.role === 'user').map(p => p.email);
        
        const notificationPromises = partnersToNotifyEmails.map(partnerEmail => 
          base44.entities.StatusUpdate.create({
            partner_email: partnerEmail,
            title: "Requirement Activated",
            message: `${requirement.requirement_name}: ${requirement.instructions}${requirement.deadline ? ` Deadline: ${new Date(requirement.deadline).toLocaleDateString()}` : ''}`,
            type: requirement.is_mandatory ? "action_required" : "info",
            read: false
          })
        );
        
        await Promise.all(notificationPromises);
      }
      
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Admin access required</p>
      </div>
    );
  }

  const getTypeLabel = (type) => {
    const labels = {
      deliverable_upload: "Upload",
      nomination_submission: "Nomination",
      form_completion: "Form",
      profile_update: "Profile"
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      deliverable_upload: "bg-blue-100 text-blue-800",
      nomination_submission: "bg-purple-100 text-purple-800",
      form_completion: "bg-green-100 text-green-800",
      profile_update: "bg-orange-100 text-orange-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getAppliesTo = (requirement) => {
    const types = requirement.applies_to_partner_types || [];
    const emails = requirement.applies_to_partner_emails || [];
    
    if (types.length === 0 && emails.length === 0) return "None";
    
    const parts = [];
    if (types.length > 0) parts.push(`${types.length} type(s)`);
    if (emails.length > 0) parts.push(`${emails.length} partner(s)`);
    
    return parts.join(", ");
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner Requirements</h1>
            <p className="text-gray-600 mt-1">Manage centralized requirements for all partners</p>
          </div>
          <Button
            onClick={() => {
              setEditingRequirement(null);
              setShowDialog(true);
            }}
            className="bg-gradient-to-r from-orange-500 to-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Requirement
          </Button>
        </div>

        <Card className="border-orange-100 shadow-md mb-6">
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Requirements</p>
                <p className="text-2xl font-bold text-blue-700">{requirements.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-700">
                  {requirements.filter(r => r.is_active).length}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Mandatory</p>
                <p className="text-2xl font-bold text-orange-700">
                  {requirements.filter(r => r.is_mandatory).length}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Partners</p>
                <p className="text-2xl font-bold text-purple-700">{allPartners.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 shadow-md">
          <CardHeader>
            <CardTitle>All Requirements ({requirements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Applies To</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map((requirement) => (
                    <TableRow key={requirement.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{requirement.requirement_name}</p>
                          {requirement.is_mandatory && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 mt-1">
                              Mandatory
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeColor(requirement.requirement_type)}>
                          {getTypeLabel(requirement.requirement_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{getAppliesTo(requirement)}</p>
                      </TableCell>
                      <TableCell>
                        {requirement.deadline ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {format(new Date(requirement.deadline), 'MMM d, yyyy')}
                          </div>
                        ) : (
                          <span className="text-gray-400">No deadline</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={requirement.is_active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ 
                                id: requirement.id, 
                                isActive: checked,
                                requirement: requirement 
                              })
                            }
                          />
                          {requirement.is_active ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingRequirement(requirement);
                              setShowDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(requirement.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {requirements.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No requirements yet</h3>
                <p className="text-gray-600 mb-6">Create your first requirement to get started</p>
                <Button
                  onClick={() => {
                    setEditingRequirement(null);
                    setShowDialog(true);
                  }}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Requirement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {showDialog && (
        <RequirementDialog
          requirement={editingRequirement}
          allPartners={allPartners}
          onClose={() => {
            setShowDialog(false);
            setEditingRequirement(null);
          }}
        />
      )}
    </div>
  );
}
