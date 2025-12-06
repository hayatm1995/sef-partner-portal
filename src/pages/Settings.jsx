import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Settings as SettingsIcon, Bell, Mail, User, Shield, Palette, Save } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    reminderEmails: true,
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and notifications</p>
        </div>

        <Tabs defaultValue="notifications">
          <TabsList className="mb-6">
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <User className="w-4 h-4" />
              Account
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="gap-2">
                <Shield className="w-4 h-4" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="notifications">
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive email updates about your submissions</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-gray-600">Get instant notifications in your browser</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, pushNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Weekly Digest</Label>
                    <p className="text-sm text-gray-600">Receive a weekly summary of your activity</p>
                  </div>
                  <Switch
                    checked={settings.weeklyDigest}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, weeklyDigest: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Reminder Emails</Label>
                    <p className="text-sm text-gray-600">Get reminders about upcoming deadlines</p>
                  </div>
                  <Switch
                    checked={settings.reminderEmails}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, reminderEmails: checked }))
                    }
                  />
                </div>

                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={user?.full_name || ''} disabled className="mt-2" />
                </div>

                <div>
                  <Label>Email Address</Label>
                  <Input value={user?.email || ''} disabled className="mt-2" />
                </div>

                <div>
                  <Label>Company Name</Label>
                  <Input value={user?.company_name || ''} disabled className="mt-2" />
                </div>

                <div>
                  <Label>Role</Label>
                  <div className="mt-2">
                    <Badge className="capitalize">{user?.role}</Badge>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  To update your account information, please contact your account manager or support.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <div className="space-y-6">
                <Card className="border-green-100">
                  <CardHeader>
                    <CardTitle>Admin Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link to={createPageUrl("EmailTemplates")}>
                      <Button variant="outline" className="w-full justify-start gap-3">
                        <Mail className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-medium">Email Templates</div>
                          <div className="text-xs text-gray-500">Customize automated email templates</div>
                        </div>
                      </Button>
                    </Link>

                    <Link to={createPageUrl("AdminRequirements")}>
                      <Button variant="outline" className="w-full justify-start gap-3">
                        <Shield className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-medium">Partner Requirements</div>
                          <div className="text-xs text-gray-500">Configure partner requirements and deadlines</div>
                        </div>
                      </Button>
                    </Link>

                    <Link to={createPageUrl("AdminPartnerManager")}>
                      <Button variant="outline" className="w-full justify-start gap-3">
                        <User className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-medium">Partner Management</div>
                          <div className="text-xs text-gray-500">Create and manage partner accounts</div>
                        </div>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
}