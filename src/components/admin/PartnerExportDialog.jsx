import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, FileText, Table } from "lucide-react";

export default function PartnerExportDialog({ partners, profiles, onClose }) {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    setExporting(true);
    
    const headers = [
      "Partner Name",
      "Email",
      "Company",
      "Account Manager",
      "Manager Email",
      "Manager Phone",
      "Allocated Amount",
      "Package Tier"
    ];

    const rows = partners.map(partner => {
      const profile = profiles.find(p => p.partner_email === partner.email);
      return [
        partner.full_name || '',
        partner.email || '',
        partner.company_name || '',
        profile?.account_manager_name || '',
        profile?.account_manager_email || '',
        profile?.account_manager_phone || '',
        profile?.allocated_amount || '',
        profile?.package_tier || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `partners_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setExporting(false);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Partner Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Export includes:</p>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Partner contact information</li>
              <li>Partnership details</li>
              <li>Assigned account managers</li>
              <li>Package and allocation information</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={exportToCSV}
              disabled={exporting}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
            >
              <Table className="w-4 h-4 mr-2" />
              Export as CSV
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Exporting {partners.length} partner record{partners.length !== 1 ? 's' : ''}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}