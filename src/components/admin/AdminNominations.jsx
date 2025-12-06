import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

export default function AdminNominations({ nominations, onUpdate }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
  });

  const getPartnerName = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return partner?.full_name || email;
  };

  const getPartnerCompany = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return partner?.company_name || '';
  };

  const handleStatusUpdate = (status) => {
    if (selectedItem) {
      onUpdate(selectedItem.id, { status, admin_notes: adminNotes });
      setSelectedItem(null);
      setAdminNotes("");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-purple-100 text-purple-800",
      approved: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (!nominations || nominations.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">No nominations to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nominee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nominations.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nominee_name}</TableCell>
                    <TableCell className="capitalize">{item.nomination_type}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getPartnerName(item.partner_email)}</p>
                        <p className="text-xs text-gray-500">{item.partner_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getPartnerCompany(item.partner_email) || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {item.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(item.created_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setAdminNotes(item.admin_notes || "");
                        }}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Nomination</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedItem.nominee_name}</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Type:</span> {selectedItem.nomination_type}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Partner:</span>{' '}
                    <span className="text-blue-600">{getPartnerName(selectedItem.partner_email)}</span>
                  </p>
                  {getPartnerCompany(selectedItem.partner_email) && (
                    <p className="text-gray-600">
                      <span className="font-medium">Company:</span>{' '}
                      {getPartnerCompany(selectedItem.partner_email)}
                    </p>
                  )}
                  <p className="text-gray-600">
                    <span className="font-medium">Partner Email:</span> {selectedItem.partner_email}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Contact:</span> {selectedItem.contact_email}
                  </p>
                  {selectedItem.contact_phone && (
                    <p className="text-gray-600">
                      <span className="font-medium">Phone:</span> {selectedItem.contact_phone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <p className="text-gray-700 p-3 bg-gray-50 rounded-lg">{selectedItem.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('under_review')}
                >
                  Mark Under Review
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('declined')}
                  className="text-red-600"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}