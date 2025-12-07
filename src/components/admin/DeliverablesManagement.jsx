import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deliverablesService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileText, Calendar, Trash2, Edit, CheckCircle, Clock, XCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import PartnerMessages from "@/components/messaging/PartnerMessages";

export default function DeliverablesManagement({ partnerId }) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [discussingDeliverable, setDiscussingDeliverable] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "file",
    due_date: "",
  });

  // Fetch deliverables for this partner
  const { data: deliverables = [], isLoading } = useQuery({
    queryKey: ['partnerDeliverables', partnerId],
    queryFn: async () => {
      return deliverablesService.getAll(partnerId);
    },
    enabled: !!partnerId,
  });

  // Create deliverable mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      return deliverablesService.create({
        ...data,
        partner_id: partnerId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerDeliverables', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['allDeliverables'] });
      setShowAddDialog(false);
      setFormData({ name: "", description: "", type: "file", due_date: "" });
      toast.success('Deliverable created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create deliverable: ' + error.message);
    },
  });

  // Delete deliverable mutation
  const deleteMutation = useMutation({
    mutationFn: async (deliverableId) => {
      return deliverablesService.delete(deliverableId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerDeliverables', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['allDeliverables'] });
      toast.success('Deliverable deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete deliverable: ' + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please provide a title');
      return;
    }
    createMutation.mutate(formData);
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending", icon: Clock },
      submitted: { color: "bg-blue-100 text-blue-800", label: "Submitted", icon: FileText },
      approved: { color: "bg-green-100 text-green-800", label: "Approved", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected", icon: XCircle },
      revision_required: { color: "bg-orange-100 text-orange-800", label: "Revision Required", icon: Clock },
    };
    const config = configs[status?.toLowerCase()] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Deliverables</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Assign and manage deliverables for this partner.
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Deliverable
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : deliverables.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No deliverables assigned yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Deliverable
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliverables.map((deliverable) => (
                  <TableRow key={deliverable.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{deliverable.name || deliverable.title}</div>
                        {deliverable.description && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {deliverable.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {deliverable.type || 'file'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {deliverable.due_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {format(new Date(deliverable.due_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(deliverable.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDiscussingDeliverable(deliverable)}
                          title="Discuss this deliverable"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/admin/deliverables-review?partnerId=${partnerId}&deliverableId=${deliverable.id}`, '_blank')}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this deliverable?')) {
                              deleteMutation.mutate(deliverable.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Deliverable Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Deliverable</DialogTitle>
            <DialogDescription>
              Assign a new deliverable to this partner.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Title *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Company Logo, Brand Guidelines"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of what is required..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file">File Upload</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Deliverable'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deliverable Discussion Drawer */}
      <Sheet open={!!discussingDeliverable} onOpenChange={(open) => !open && setDiscussingDeliverable(null)}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              Discuss: {discussingDeliverable?.name || discussingDeliverable?.title}
            </SheetTitle>
            <SheetDescription>
              Chat about this deliverable with the partner
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 h-[calc(100vh-200px)]">
            {discussingDeliverable && (
              <PartnerMessages
                partnerId={partnerId}
                deliverableId={discussingDeliverable.id}
                onClose={() => setDiscussingDeliverable(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

