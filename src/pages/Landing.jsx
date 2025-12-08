import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Users, FileText, Award, Shield, UserCog, Briefcase, ChevronDown } from 'lucide-react';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Landing() {
  const navigate = useNavigate();
  const { setSelectedRole, setSelectedPartnerId, selectedRole, selectedPartnerId } = useRoleSelection();
  const [hoveredRole, setHoveredRole] = useState(null);
  const [localSelectedPartner, setLocalSelectedPartner] = useState(null);

  // Fetch all partners for dropdowns
  const { data: partners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['allPartnersForSelection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, tier')
        .order('name');
      
      if (error) {
        console.error('Error fetching partners:', error);
        return [];
      }
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Clear partner selection when changing roles
    setSelectedPartnerId(null);
    setLocalSelectedPartner(null);
  };

  const handlePartnerSelect = (partnerId) => {
    const partner = partners.find(p => p.id === parseInt(partnerId));
    setLocalSelectedPartner(partnerId);
    setSelectedPartnerId(partnerId ? parseInt(partnerId) : null);
  };

  const handleContinue = () => {
    if (!selectedRole) return;
    
    // For partners, require partner selection
    if (selectedRole === 'partner' && !selectedPartnerId) {
      return; // Don't navigate if partner not selected
    }
    
    // Navigate based on role
    if (selectedRole === 'superadmin' || selectedRole === 'admin') {
      navigate('/admin/dashboard');
    } else if (selectedRole === 'partner') {
      navigate('/PartnerHub');
    }
  };

  const roleCards = [
    {
      role: 'superadmin',
      title: 'Superadmin',
      description: 'Full system access and control',
      icon: Shield,
      gradient: 'from-purple-500 to-indigo-600',
      hoverGradient: 'from-purple-600 to-indigo-700',
    },
    {
      role: 'admin',
      title: 'Admin',
      description: 'Manage partners and content',
      icon: UserCog,
      gradient: 'from-blue-500 to-cyan-600',
      hoverGradient: 'from-blue-600 to-cyan-700',
    },
    {
      role: 'partner',
      title: 'Partner',
      description: 'Access your partner hub',
      icon: Briefcase,
      gradient: 'from-orange-500 to-amber-600',
      hoverGradient: 'from-orange-600 to-amber-700',
    },
  ];

  const canContinue = selectedRole && (selectedRole !== 'partner' || selectedPartnerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl w-full"
      >
        {/* Logo and Branding */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl mb-6"
          >
            <span className="text-4xl font-bold text-white">SEF</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4"
          >
            SEF Partner Portal
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Your gateway to managing your partnership with Sharjah Entrepreneurship Festival 2026
          </motion.p>
        </div>

        {/* Role Selection Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
            Select Your Role
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {roleCards.map((card) => {
              const Icon = card.icon;
              const isHovered = hoveredRole === card.role;
              const isSelected = selectedRole === card.role;
              
              return (
                <motion.div
                  key={card.role}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onHoverStart={() => setHoveredRole(card.role)}
                  onHoverEnd={() => setHoveredRole(null)}
                  className="relative"
                >
                  <button
                    onClick={() => handleRoleSelect(card.role)}
                    className={`w-full p-8 bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 group cursor-pointer ${
                      isSelected 
                        ? 'border-orange-500 shadow-2xl' 
                        : isHovered 
                        ? 'border-orange-300 shadow-xl' 
                        : 'border-transparent'
                    }`}
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${isHovered || isSelected ? card.hoverGradient : card.gradient} rounded-xl flex items-center justify-center mb-4 mx-auto transition-all duration-300 group-hover:scale-110`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                    {isSelected && (
                      <div className="mt-4 flex items-center justify-center text-orange-600">
                        <span className="text-sm font-semibold">Selected</span>
                      </div>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Partner Selection Dropdown */}
        {selectedRole && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8 max-w-md mx-auto"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                {selectedRole === 'partner' 
                  ? 'Select Your Partner Organization' 
                  : selectedRole === 'admin' || selectedRole === 'superadmin'
                  ? 'Filter by Partner (Optional)'
                  : 'Select Partner'}
              </h3>
              
              {partnersLoading ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading partners...</p>
                </div>
              ) : partners.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No partners available
                </p>
              ) : (
                <Select 
                  value={localSelectedPartner || ''} 
                  onValueChange={handlePartnerSelect}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      selectedRole === 'partner' 
                        ? "Choose your partner organization..." 
                        : "View all partners (or select one to filter)"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRole !== 'partner' && (
                      <SelectItem value="">All Partners</SelectItem>
                    )}
                    {partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id.toString()}>
                        {partner.name} {partner.tier ? `(${partner.tier})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {selectedRole === 'partner' && !selectedPartnerId && (
                <p className="text-sm text-orange-600 mt-3 text-center">
                  Please select a partner to continue
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Continue Button */}
        {selectedRole && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <Button
              onClick={handleContinue}
              disabled={!canContinue}
              size="lg"
              className={`px-8 py-6 text-lg font-semibold shadow-xl transition-all ${
                canContinue
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white hover:shadow-2xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue to Portal
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        )}

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
        >
          <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Deliverables</h3>
            <p className="text-sm text-gray-600">Track and submit required deliverables</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Nominations</h3>
            <p className="text-sm text-gray-600">Submit and manage award nominations</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Building2 className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Partner Hub</h3>
            <p className="text-sm text-gray-600">Access your complete partnership dashboard</p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-sm text-gray-500 mt-12"
        >
          Sharjah Entrepreneurship Festival 2026
        </motion.p>
      </motion.div>
    </div>
  );
}
