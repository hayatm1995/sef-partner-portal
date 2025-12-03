import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Plus, Search, Filter, FolderOpen, 
  CheckCircle, Clock, Send, Eye, XCircle, Archive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ContractCard from "../components/contracts/ContractCard";
import ContractDetail from "../components/contracts/ContractDetail";
import UploadContractDialog from "../components/contracts/UploadContractDialog";

const statusFilters = [
  { id: "all", label: "All", icon: FolderOpen },
  { id: "draft", label: "Draft", icon: FileText },
  { id: "sent", label: "Sent", icon: Send },
  { id: "under_review", label: "Review", icon: Eye },
  { id: "signed", label: "Signed", icon: CheckCircle },
  { id: "rejected", label: "Rejected", icon: XCircle },
];

export default function Contracts() {
  const [selectedContract, setSelectedContract] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const urlParams = new URLSearchParams(location.search);
  const viewAsEmail = urlParams.get('viewAs');
  const effectiveEmail = viewAsEmail || user?.email;
  const isAdmin = user?.role === 'admin' || user?.is_super_admin;
  const isAdminGlobalView = isAdmin && !viewAsEmail;

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', effectiveEmail, isAdminGlobalView],
    queryFn: async () => {
      if (isAdminGlobalView) {
        return base44.entities.Contract.list('-created_date');
      }
      return base44.entities.Contract.filter({ partner_email: effectiveEmail }, '-created_date');
    },
    enabled: !!user,
  });

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  const getPartnerName = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return partner?.full_name || email;
  };

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (isAdminGlobalView && getPartnerName(contract.partner_email).toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: contracts.length,
    signed: contracts.filter(c => c.status === 'signed').length,
    pending: contracts.filter(c => ['draft', 'sent', 'under_review'].includes(c.status)).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 shadow-2xl">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <motion.div 
                className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <FileText className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  {isAdminGlobalView ? 'All Contracts' : 'My Contracts'}
                </h1>
                <p className="text-orange-100 text-lg">
                  {isAdminGlobalView 
                    ? 'Manage partnership agreements across all partners' 
                    : 'View and discuss your partnership agreements'}
                </p>
              </div>
            </div>

            {isAdmin && (
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-white text-orange-600 hover:bg-orange-50 shadow-lg"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Upload Contract
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <motion.div 
              className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-4xl font-bold text-white">{stats.total}</p>
              <p className="text-orange-100 text-sm">Total Contracts</p>
            </motion.div>
            <motion.div 
              className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-4xl font-bold text-white">{stats.signed}</p>
              <p className="text-orange-100 text-sm">Signed</p>
            </motion.div>
            <motion.div 
              className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-4xl font-bold text-white">{stats.pending}</p>
              <p className="text-orange-100 text-sm">Pending</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-6 h-[calc(100vh-380px)] min-h-[500px]">
          {/* Left Panel - Contract List */}
          <div className="w-96 flex-shrink-0 flex flex-col">
            <Card className="flex-1 flex flex-col border-2 border-orange-100 shadow-xl overflow-hidden">
              {/* Search & Filter */}
              <div className="p-4 border-b bg-gray-50 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 border-gray-200"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {statusFilters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={statusFilter === filter.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(filter.id)}
                      className={`text-xs ${statusFilter === filter.id ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                    >
                      <filter.icon className="w-3 h-3 mr-1" />
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Contract List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence>
                  {filteredContracts.length > 0 ? (
                    filteredContracts.map((contract, index) => (
                      <motion.div
                        key={contract.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ContractCard
                          contract={contract}
                          isSelected={selectedContract?.id === contract.id}
                          onClick={() => setSelectedContract(contract)}
                          showPartner={isAdminGlobalView}
                          partnerName={isAdminGlobalView ? getPartnerName(contract.partner_email) : null}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {contracts.length === 0 ? 'No contracts yet' : 'No contracts match your filter'}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {isAdmin && contracts.length === 0 
                          ? 'Upload a contract to get started' 
                          : 'Try adjusting your search or filter'}
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </div>

          {/* Right Panel - Contract Detail */}
          <div className="flex-1">
            <Card className="h-full border-2 border-orange-100 shadow-xl overflow-hidden">
              {selectedContract ? (
                <ContractDetail
                  contract={selectedContract}
                  isAdmin={isAdmin}
                  user={user}
                  partnerName={isAdminGlobalView ? getPartnerName(selectedContract.partner_email) : null}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-12 h-12 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Contract</h3>
                    <p className="text-gray-500 max-w-md">
                      Choose a contract from the list to view its details, download the document, or participate in discussions.
                    </p>
                  </motion.div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <UploadContractDialog
          onClose={() => setShowUploadDialog(false)}
          partners={allPartners}
        />
      )}
    </div>
  );
}