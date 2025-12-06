import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { partnerProgressService, exhibitorStandsService, partnerMessagesService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Activity, MessageSquare, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminControlRoom() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'sef_admin' || user?.is_super_admin;

  const { data: progress = [] } = useQuery({
    queryKey: ['controlRoomProgress'],
    queryFn: () => partnerProgressService.getAll(),
    enabled: isSuperAdmin,
  });

  const { data: stands = [] } = useQuery({
    queryKey: ['controlRoomStands'],
    queryFn: () => exhibitorStandsService.getAll(),
    enabled: isSuperAdmin,
  });

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['controlRoomUnread'],
    queryFn: () => partnerMessagesService.getAdminUnreadCount(),
    enabled: isSuperAdmin,
  });

  const buildStats = useMemo(() => {
    const stats = { sef_built: 0, custom_build: 0, unselected: 0 };
    stands.forEach((s) => {
      if (s.build_option === 'custom_build') stats.custom_build += 1;
      else if (s.build_option === 'sef_built') stats.sef_built += 1;
      else stats.unselected += 1;
    });
    return stats;
  }, [stands]);

  const exportCsv = () => {
    if (!progress.length) {
      toast.error('No data to export');
      return;
    }
    const header = ['Partner', 'Progress %', 'Deliverables Done', 'Pending Deliverables'];
    const rows = progress.map((p) => [
      `"${p.partner_name || ''}"`,
      p.progress_percentage || 0,
      p.completed_deliverables || 0,
      p.pending_deliverables || 0,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'control-room-export.csv';
    link.click();
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control Room</h1>
          <p className="text-gray-600">Superadmin-only insights and exports.</p>
        </div>
        <Button onClick={exportCsv} className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Deliverables Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {Math.round(
              progress.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) /
                (progress.length || 1)
            )}%
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Booth Build Choices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>SEF Builds</span>
              <Badge variant="secondary">{buildStats.sef_built}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Self-Build</span>
              <Badge variant="secondary">{buildStats.custom_build}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Not chosen</span>
              <Badge variant="outline">{buildStats.unselected}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Unread Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {unreadMessages}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partner Status Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progress.map((row) => (
                  <TableRow key={row.partner_id}>
                    <TableCell className="font-medium">{row.partner_name}</TableCell>
                    <TableCell>{Math.round(row.progress_percentage || 0)}%</TableCell>
                    <TableCell>{row.completed_deliverables || 0}</TableCell>
                    <TableCell>{row.pending_deliverables || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

