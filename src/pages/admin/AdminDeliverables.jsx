import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { deliverablesService, partnerSubmissionsService, partnersService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Clock, CheckCircle, XCircle, Loader2, FileText, Eye, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import DeliverableReviewDrawer from "@/components/deliverables/DeliverableReviewDrawer";
import Breadcrumbs from "@/components/common/Breadcrumbs";

export default function AdminDeliverables() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'sef_admin' || user?.is_super_admin;

  // Redirect if not admin
  React.useEffect(() => {
    if (user && !isAdmin) {
      window.location.href = "/Dashboard";
    }
  }, [user, isAdmin]);

  // Fetch all deliverables
  const { data: allDeliverables = [], isLoading } = useQuery({
    queryKey: ['allDeliverables'],
    queryFn: async () => deliverablesService.getAll(),
    enabled: isAdmin,
  });

  // Fetch all submissions
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['allSubmissions'],
    queryFn: async () => {
      try {
        return await partnerSubmissionsService.getAll();
      } catch (error) {
        console.error('Error fetching all submissions:', error);
        return [];
      }
    },
    enabled: isAdmin,
  });

  // Fetch all partners
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: async () => partnersService.getAll(),
    enabled: isAdmin,
  });

  // Create maps for quick lookup
  const submissionsMap = useMemo(() => {
    const map = {};
    allSubmissions.forEach(sub => {
      const deliverableId = sub.deliverable_id;
      // Get latest submission per deliverable
      if (!map[deliverableId] || 
          (sub.version || 0) > (map[deliverableId].version || 0) ||
          new Date(sub.created_at) > new Date(map[deliverableId].created_at)) {
        map[deliverableId] = sub;
      }
    });
    return map;
  }, [allSubmissions]);

  const partnerMap = useMemo(() => {
    const map = {};
    allPartners.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [allPartners]);

  // Filter deliverables
  const filteredDeliverables = useMemo(() => {
    let filtered = allDeliverables;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => {
        const partner = partnerMap[d.partner_id];
        const submission = submissionsMap[d.id];
        return (
          d.name?.toLowerCase().includes(query) ||
          partner?.name?.toLowerCase().includes(query) ||
          d.type?.toLowerCase().includes(query) ||
          submission?.file_name?.toLowerCase().includes(query)
        );
      });
    }

    // Sort: pending first, then by due date
    return filtered.sort((a, b) => {
      const subA = submissionsMap[a.id];
      const subB = submissionsMap[b.id];
      
      // Pending first
      if (subA?.status === 'pending' && subB?.status !== 'pending') return -1;
      if (subA?.status !== 'pending' && subB?.status === 'pending') return 1;
      
      // Then by due date (overdue first)
      if (a.due_date && b.due_date) {
        const aOverdue = new Date(a.due_date) < new Date();
        const bOverdue = new Date(b.due_date) < new Date();
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [allDeliverables, searchQuery, submissionsMap, partnerMap]);

  const getStatusBadge = (status) => {
    const configs = {
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      approved: { className: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
    };
    const config = configs[status] || { className: 'bg-gray-100 text-gray-800', label: 'No Submission', icon: FileText };
    const Icon = config.icon;
    
    return (
      <Badge className={config.className} variant="outline">
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Breadcrumbs 
            items={[
              { label: 'Admin', href: '/admin/partners' },
              { label: 'Deliverables', href: '/admin/deliverables' },
            ]}
          />
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Deliverables Management</h1>
          <p className="text-gray-600 mt-1">Review and manage all partner deliverables</p>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by partner name, deliverable name, or file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Deliverables Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              All Deliverables ({filteredDeliverables.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                <span className="ml-3 text-gray-600">Loading deliverables...</span>
              </div>
            ) : filteredDeliverables.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchQuery ? 'No deliverables found matching your search.' : 'No deliverables found.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Deliverable Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Last Upload</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeliverables.map((deliverable) => {
                      const submission = submissionsMap[deliverable.id];
                      const partner = partnerMap[deliverable.partner_id];
                      const overdue = isOverdue(deliverable.due_date);

                      return (
                        <TableRow key={deliverable.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {partner?.name || (
                              <span className="text-gray-400 italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold">{deliverable.name || deliverable.title || 'Untitled'}</p>
                              {deliverable.type && (
                                <p className="text-xs text-gray-500">{deliverable.type}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {submission ? (
                              getStatusBadge(submission.status)
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                No Submission
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {deliverable.due_date ? (
                              <div className="flex items-center gap-2">
                                <span className={overdue ? "text-red-600 font-semibold" : "text-gray-700"}>
                                  {format(new Date(deliverable.due_date), 'MMM d, yyyy')}
                                </span>
                                {overdue && (
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {submission ? (
                              <div className="text-sm">
                                <p className="text-gray-900">
                                  {submission.file_name || 'Unknown file'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(submission.created_at), 'MMM d, yyyy')}
                                </p>
                                {submission.version && (
                                  <p className="text-xs text-gray-400">Version {submission.version}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDeliverable({ deliverable, partner })}
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Drawer */}
        {selectedDeliverable && (
          <DeliverableReviewDrawer
            open={!!selectedDeliverable}
            onClose={() => setSelectedDeliverable(null)}
            deliverable={selectedDeliverable.deliverable}
            partner={selectedDeliverable.partner}
          />
        )}
      </div>
    </div>
  );
}
