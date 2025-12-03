import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PartnerEngagementTable({ partners, deliverables, nominations }) {
  const getEngagementScore = (partner) => {
    const partnerDeliverables = deliverables.filter(d => d.partner_email === partner.email);
    const partnerNominations = nominations.filter(n => n.partner_email === partner.email);
    
    const deliverableScore = Math.min(partnerDeliverables.length * 10, 50);
    const nominationScore = Math.min(partnerNominations.length * 15, 30);
    const profileScore = partner.profile_completion || 0;
    
    return Math.min(deliverableScore + nominationScore + profileScore * 0.2, 100);
  };

  const sortedPartners = partners
    .filter(p => p.role === 'user')
    .map(p => ({
      ...p,
      engagementScore: getEngagementScore(p),
      deliverableCount: deliverables.filter(d => d.partner_email === p.email).length,
      nominationCount: nominations.filter(n => n.partner_email === p.email).length
    }))
    .sort((a, b) => b.engagementScore - a.engagementScore);

  return (
    <Card className="border-orange-100 shadow-md">
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Engagement Score</TableHead>
                <TableHead>Deliverables</TableHead>
                <TableHead>Nominations</TableHead>
                <TableHead>Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{partner.full_name}</p>
                      <p className="text-sm text-gray-500">{partner.company_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {partner.badge_level && (
                      <Badge className="capitalize">{partner.badge_level}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="w-32">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{Math.round(partner.engagementScore)}%</span>
                      </div>
                      <Progress value={partner.engagementScore} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{partner.deliverableCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{partner.nominationCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{partner.profile_completion || 0}%</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}