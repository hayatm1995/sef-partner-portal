import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { contractsService, partnersService, contractDiscussionsService } from '@/services/supabaseService';
import { supabase } from '@/config/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Search, 
  Upload, 
  Download, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Send,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function AdminContracts() {
  const { user, currentPartnerId } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [selectedContract, setSelectedContract] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDiscussionDialog, setShowDiscussionDialog] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'sef_admin' || user?.is_super_admin;

  // Fetch all contracts
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['adminContracts', statusFilter, partnerFilter],
    queryFn: async () => {
      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (partnerFilter !== 'all') filters.partner_id = partnerFilter;
      return contractsService.getAll(filters);
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  // Fetch all partners for filter
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => partnersService.getAll(),
    enabled: isAdmin,
  });

  // Upload contract mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ partnerId, title, contractType, file }) => {
      if (!file) throw new Error('Please select a file');

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = `contracts/${partnerId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      // Create contract
      return contractsService.create({
        partner_id: partnerId,
        title,
        contract_type: contractType,
        file_url_original: urlData.publicUrl,
        status: 'sent',
        created_by: user?.partner_user?.id,
      });
    },
    onSuccess: () => {
      toast.success('Contract uploaded and sent to partner');
      queryClient.invalidateQueries({ queryKey: ['adminContracts'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setShowUploadDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload contract');
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }) => {
      return contractsService.updateStatus(id, status, notes);
    },
    onSuccess: () => {
      toast.success('Contract status updated');
      queryClient.invalidateQueries({ queryKey: ['adminContracts'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setShowStatusDialog(false);
      setSelectedContract(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status');
    }
  });

  // Filtered contracts
  const filteredContracts = React.useMemo(() => {
    let filtered = contracts;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.title?.toLowerCase().includes(query) ||
        c.partners?.name?.toLowerCase().includes(query) ||
        c.contract_type?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [contracts, searchQuery]);

  const getStatusBadge = (status) => {
    const configs = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent' },
      signed: { color: 'bg-green-100 text-green-800', label: 'Signed' },
      approved: { color: 'bg-purple-100 text-purple-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    };
    return configs[status] || configs.draft;
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Access denied. Admin only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contracts</h1>
            <p className="text-gray-600">Manage all partner contracts</p>
          </div>
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Contract
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by title, partner, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partners</SelectItem>
                  {allPartners.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.length > 0 ? (
                    filteredContracts.map((contract) => {
                      const statusConfig = getStatusBadge(contract.status);
                      return (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">
                            {contract.partners?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>{contract.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{contract.contract_type || 'Partnership'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(contract.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {contract.file_url_original && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(contract.file_url_original, '_blank')}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                              {contract.file_url_signed && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(contract.file_url_signed, '_blank')}
                                  title="Download Signed"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedContract(contract);
                                  setShowStatusDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedContract(contract);
                                  setShowDiscussionDialog(true);
                                }}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No contracts found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Upload Contract Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Contract</DialogTitle>
            </DialogHeader>
            <UploadContractForm
              partners={allPartners}
              onSubmit={(data) => uploadMutation.mutate(data)}
              isLoading={uploadMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Contract Status</DialogTitle>
            </DialogHeader>
            {selectedContract && (
              <UpdateStatusForm
                contract={selectedContract}
                onSubmit={(data) => updateStatusMutation.mutate({ id: selectedContract.id, ...data })}
                isLoading={updateStatusMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Discussion Dialog */}
        <Dialog open={showDiscussionDialog} onOpenChange={setShowDiscussionDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Contract Discussion</DialogTitle>
            </DialogHeader>
            {selectedContract && (
              <ContractDiscussion contractId={selectedContract.id} />
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}

// Upload Contract Form Component
function UploadContractForm({ partners, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    partnerId: '',
    title: '',
    contractType: 'Partnership',
    file: null,
  });
  const fileInputRef = React.useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.partnerId || !formData.title || !formData.file) {
      toast.error('Please fill all fields and select a file');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Partner *</Label>
        <Select
          value={formData.partnerId}
          onValueChange={(value) => setFormData({ ...formData, partnerId: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select partner" />
          </SelectTrigger>
          <SelectContent>
            {partners.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Contract Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Sponsorship Agreement 2026"
          required
        />
      </div>
      <div>
        <Label>Contract Type *</Label>
        <Select
          value={formData.contractType}
          onValueChange={(value) => setFormData({ ...formData, contractType: value })}
          required
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Sponsorship">Sponsorship</SelectItem>
            <SelectItem value="Media">Media</SelectItem>
            <SelectItem value="Retail">Retail</SelectItem>
            <SelectItem value="Partnership">Partnership</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Contract File *</Label>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] })}
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Send
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// Update Status Form Component
function UpdateStatusForm({ contract, onSubmit, isLoading }) {
  const [status, setStatus] = useState(contract.status);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ status, notes: notes.trim() || null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Status *</Label>
        <Select value={status} onValueChange={setStatus} required>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="signed">Signed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this status change..."
          rows={4}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Status'
          )}
        </Button>
      </div>
    </form>
  );
}

// Contract Discussion Component
function ContractDiscussion({ contractId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);

  const { data: discussions = [] } = useQuery({
    queryKey: ['contractDiscussions', contractId],
    queryFn: () => contractDiscussionsService.getByContractId(contractId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, file }) => {
      // Upload file if provided
      let fileUrl = null;
      if (file) {
        const filePath = `contracts/discussions/${contractId}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('public')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      }

      // Get contract to get partner_id
      const contract = await contractsService.getById(contractId);

      return contractDiscussionsService.create({
        contract_id: contractId,
        partner_id: contract.partner_id,
        sender_id: user?.partner_user?.id,
        sender_role: user?.role === 'admin' || user?.role === 'sef_admin' ? 'admin' : 'partner',
        message,
        file_url: fileUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractDiscussions', contractId] });
      setMessage('');
      setFile(null);
    },
  });

  return (
    <div className="space-y-4">
      <div className="max-h-96 overflow-y-auto space-y-3">
        {discussions.map((discussion) => (
          <div
            key={discussion.id}
            className={`flex gap-3 ${discussion.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] rounded-lg p-3 ${
              discussion.sender_role === 'admin'
                ? 'bg-orange-100 text-gray-900'
                : 'bg-gray-100 text-gray-900'
            }`}>
              <p className="text-sm font-medium mb-1">
                {discussion.sender?.full_name || 'Unknown'}
              </p>
              <p className="text-sm">{discussion.message}</p>
              {discussion.file_url && (
                <a
                  href={discussion.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                >
                  📎 Attachment
                </a>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(discussion.created_at), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (message.trim() || file) {
            sendMessageMutation.mutate({ message: message.trim(), file });
          }
        }}
        className="space-y-2"
      >
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0])}
          className="text-sm"
        />
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={sendMessageMutation.isPending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

