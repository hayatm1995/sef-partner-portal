import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Play,
  Clock,
  Mail,
  CheckCircle,
  AlertCircle,
  Calendar,
  Filter,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export default function AdminReminders() {
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [configForm, setConfigForm] = useState({
    config_name: "",
    reminder_type: "deliverable_deadline",
    days_before_deadline: "7,3,1",
    email_enabled: true,
    in_app_enabled: true,
    email_subject: "",
    email_body: "",
    notification_title: "",
    notification_message: "",
    is_active: true,
    target_status: []
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: configs = [] } = useQuery({
    queryKey: ['reminderConfigs'],
    queryFn: () => base44.entities.ReminderConfig.list('-created_date'),
    enabled: !!user && (user.role === 'admin' || user.is_super_admin),
  });

  const { data: reminderLogs = [] } = useQuery({
    queryKey: ['reminderLogs'],
    queryFn: () => base44.entities.ReminderLog.list('-sent_date', 100),
    enabled: !!user && (user.role === 'admin' || user.is_super_admin),
  });

  const createConfigMutation = useMutation({
    mutationFn: (data) => base44.entities.ReminderConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminderConfigs'] });
      setShowConfigDialog(false);
      resetForm();
      toast.success('Reminder configuration created');
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ReminderConfig.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminderConfigs'] });
      setShowConfigDialog(false);
      setEditingConfig(null);
      resetForm();
      toast.success('Configuration updated');
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id) => base44.entities.ReminderConfig.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminderConfigs'] });
      toast.success('Configuration deleted');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ReminderConfig.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminderConfigs'] });
      toast.success('Status updated');
    },
  });

  const resetForm = () => {
    setConfigForm({
      config_name: "",
      reminder_type: "deliverable_deadline",
      days_before_deadline: "7,3,1",
      email_enabled: true,
      in_app_enabled: true,
      email_subject: "",
      email_body: "",
      notification_title: "",
      notification_message: "",
      is_active: true,
      target_status: []
    });
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setConfigForm({
      config_name: config.config_name,
      reminder_type: config.reminder_type,
      days_before_deadline: config.days_before_deadline.join(','),
      email_enabled: config.email_enabled,
      in_app_enabled: config.in_app_enabled,
      email_subject: config.email_subject || "",
      email_body: config.email_body || "",
      notification_title: config.notification_title || "",
      notification_message: config.notification_message || "",
      is_active: config.is_active,
      target_status: config.target_status || []
    });
    setShowConfigDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...configForm,
      days_before_deadline: configForm.days_before_deadline.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
    };

    if (editingConfig) {
      updateConfigMutation.mutate({ id: editingConfig.id, data });
    } else {
      createConfigMutation.mutate(data);
    }
  };

  const reminderTypeLabels = {
    deliverable_deadline: "Deliverable Deadline",
    nomination_deadline: "Nomination Deadline",
    approval_deadline: "Approval Deadline",
    profile_incomplete: "Profile Incomplete",
    general: "General Reminder"
  };

  const filteredConfigs = filterType === "all" 
    ? configs 
    : configs.filter(c => c.reminder_type === filterType);

  const stats = {
    total: configs.length,
    active: configs.filter(c => c.is_active).length,
    inactive: configs.filter(c => !c.is_active).length,
    sent_today: reminderLogs.filter(log => {
      const logDate = new Date(log.sent_date);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length
  };

  if (user?.role !== 'admin' && !user?.is_super_admin) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Admin access required</p>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Automated Reminder System
            </h1>
            <p className="text-gray-600 mt-1">Configure automated reminders for partners</p>
          </div>
          <Button
            onClick={() => setShowConfigDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Reminder Config
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Configs</p>
                  <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
                </div>
                <Bell className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
                  <p className="text-3xl font-bold text-green-700">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Inactive</p>
                  <p className="text-3xl font-bold text-gray-700">{stats.inactive}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Sent Today</p>
                  <p className="text-3xl font-bold text-purple-700">{stats.sent_today}</p>
                </div>
                <Mail className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="mb-6 border-2 border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-blue-600" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deliverable_deadline">Deliverable Deadline</SelectItem>
                  <SelectItem value="nomination_deadline">Nomination Deadline</SelectItem>
                  <SelectItem value="approval_deadline">Approval Deadline</SelectItem>
                  <SelectItem value="profile_incomplete">Profile Incomplete</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Configurations Table */}
        <Card className="border-2 border-blue-100 shadow-md">
          <CardHeader>
            <CardTitle>Reminder Configurations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Days Before</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.config_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {reminderTypeLabels[config.reminder_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {config.days_before_deadline.map((day, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {day}d
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {config.email_enabled && (
                            <Badge className="bg-blue-100 text-blue-800">
                              <Mail className="w-3 h-3 mr-1" />
                              Email
                            </Badge>
                          )}
                          {config.in_app_enabled && (
                            <Badge className="bg-purple-100 text-purple-800">
                              <Bell className="w-3 h-3 mr-1" />
                              In-App
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={config.is_active}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ id: config.id, is_active: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(config)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (confirm('Delete this configuration?')) {
                                deleteConfigMutation.mutate(config.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredConfigs.length === 0 && (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No configurations found</h3>
                <p className="text-gray-600 mb-6">Create your first reminder configuration to get started</p>
                <Button onClick={() => setShowConfigDialog(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Configuration
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reminder Logs */}
        <Card className="mt-6 border-2 border-blue-100 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Recent Reminder Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reminderLogs.slice(0, 10).map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{log.partner_email}</p>
                    <p className="text-xs text-gray-600">{log.reminder_type} - {log.days_before} days before</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.email_sent && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        <Mail className="w-3 h-3 mr-1" />
                        Email
                      </Badge>
                    )}
                    {log.notification_sent && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                        <Bell className="w-3 h-3 mr-1" />
                        Notif
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {format(parseISO(log.sent_date), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
              {reminderLogs.length === 0 && (
                <p className="text-center text-gray-500 py-8">No reminders sent yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Config Dialog */}
      {showConfigDialog && (
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit Reminder Configuration' : 'Create Reminder Configuration'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Configuration Name *</Label>
                  <Input
                    value={configForm.config_name}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, config_name: e.target.value }))}
                    placeholder="e.g., Deliverable 7-Day Reminder"
                    required
                  />
                </div>

                <div>
                  <Label>Reminder Type *</Label>
                  <Select
                    value={configForm.reminder_type}
                    onValueChange={(value) => setConfigForm(prev => ({ ...prev, reminder_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deliverable_deadline">Deliverable Deadline</SelectItem>
                      <SelectItem value="nomination_deadline">Nomination Deadline</SelectItem>
                      <SelectItem value="approval_deadline">Approval Deadline</SelectItem>
                      <SelectItem value="profile_incomplete">Profile Incomplete</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Days Before Deadline * (comma-separated)</Label>
                <Input
                  value={configForm.days_before_deadline}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, days_before_deadline: e.target.value }))}
                  placeholder="e.g., 7,3,1,0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter numbers separated by commas. 0 = on deadline day</p>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={configForm.email_enabled}
                    onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, email_enabled: checked }))}
                  />
                  <Label>Email Notifications</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={configForm.in_app_enabled}
                    onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, in_app_enabled: checked }))}
                  />
                  <Label>In-App Notifications</Label>
                </div>
              </div>

              {configForm.email_enabled && (
                <>
                  <div>
                    <Label>Email Subject</Label>
                    <Input
                      value={configForm.email_subject}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, email_subject: e.target.value }))}
                      placeholder="Reminder: {{deadline}} approaching"
                    />
                  </div>

                  <div>
                    <Label>Email Body</Label>
                    <Textarea
                      value={configForm.email_body}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, email_body: e.target.value }))}
                      placeholder="Hi {{partner_name}}, this is a reminder that you have {{days_remaining}} days until {{deadline}}..."
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Variables: {'{'}{'{'} partner_name {'}'}{'}'}, {'{'}{'{'} deadline {'}'}{'}'}, {'{'}{'{'} days_remaining {'}'}{'}'}
                    </p>
                  </div>
                </>
              )}

              {configForm.in_app_enabled && (
                <>
                  <div>
                    <Label>Notification Title</Label>
                    <Input
                      value={configForm.notification_title}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, notification_title: e.target.value }))}
                      placeholder="Deadline Reminder"
                    />
                  </div>

                  <div>
                    <Label>Notification Message</Label>
                    <Textarea
                      value={configForm.notification_message}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, notification_message: e.target.value }))}
                      placeholder="Your deadline is approaching in {{days_remaining}} days"
                      rows={2}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={configForm.is_active}
                  onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Active</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowConfigDialog(false);
                    setEditingConfig(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createConfigMutation.isPending || updateConfigMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-indigo-700"
                >
                  {editingConfig ? 'Update' : 'Create'} Configuration
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}