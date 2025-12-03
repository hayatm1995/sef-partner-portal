import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EmailTest() {
  const [testEmail, setTestEmail] = useState("");
  const [subject, setSubject] = useState("Test Email from SEF Portal");
  const [body, setBody] = useState("This is a test email from the SEF Partner Portal.");
  const [testResult, setTestResult] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: async ({ to, subject, body }) => {
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">SEF Email Test</h1>
          </div>
          <div style="padding: 30px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <p style="margin: 10px 0; color: #374151; line-height: 1.6;">${body}</p>
            <p style="margin: 20px 0 10px 0; color: #6b7280; font-size: 14px;">Test sent by: ${user?.email}</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Timestamp: ${new Date().toISOString()}</p>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} SEF Test Email</p>
          </div>
        </div>
      `;

      const result = await base44.integrations.Core.SendEmail({
        from_name: 'SEF Test',
        to: to,
        subject: subject,
        body: htmlBody
      });

      return result;
    },
    onSuccess: (result) => {
      setTestResult({ success: true, message: 'Email sent successfully!', data: result });
      toast.success('Test email sent successfully!');
    },
    onError: (error) => {
      setTestResult({ success: false, message: error.message, error: error });
      toast.error(`Failed to send: ${error.message}`);
    },
  });

  const handleSendTest = () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }
    if (!subject || !body) {
      toast.error('Please fill in subject and body');
      return;
    }

    setTestResult(null);
    sendTestEmailMutation.mutate({
      to: testEmail,
      subject: subject,
      body: body
    });
  };

  const handleSendToSelf = () => {
    if (!user?.email) {
      toast.error('User email not found');
      return;
    }
    setTestEmail(user.email);
    setTimeout(() => {
      sendTestEmailMutation.mutate({
        to: user.email,
        subject: subject,
        body: body
      });
    }, 100);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Functionality Test</h1>
        <p className="text-gray-600">Test email sending to diagnose issues</p>
      </div>

      <Card className="mb-6 border-blue-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Send Test Email
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Test Email Address *</Label>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>

          <div>
            <Label>Subject *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div>
            <Label>Body *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email body"
              rows={5}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSendToSelf}
              variant="outline"
              disabled={sendTestEmailMutation.isPending || !user?.email}
            >
              <Mail className="w-4 h-4 mr-2" />
              Send to Myself ({user?.email})
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={sendTestEmailMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              {sendTestEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResult && (
        <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <div className="flex items-start gap-3">
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold mb-2 ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                {testResult.success ? 'Success!' : 'Error'}
              </h3>
              <AlertDescription>
                <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                  {testResult.message}
                </p>
                {testResult.data && (
                  <div className="mt-3 p-3 bg-white border rounded text-sm">
                    <p className="font-mono text-xs text-gray-700">
                      <strong>Response:</strong>
                    </p>
                    <pre className="mt-2 text-xs overflow-auto">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                )}
                {testResult.error && (
                  <div className="mt-3 p-3 bg-white border rounded text-sm">
                    <p className="font-mono text-xs text-red-700">
                      <strong>Error Details:</strong>
                    </p>
                    <pre className="mt-2 text-xs overflow-auto text-red-600">
                      {JSON.stringify(testResult.error, null, 2)}
                    </pre>
                  </div>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-yellow-900 mb-3">Testing Guide</h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">1.</span>
              <span>Enter your email address or use "Send to Myself"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">2.</span>
              <span>Click "Send Test Email" to trigger the Core.SendEmail integration</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">3.</span>
              <span>Check the result below - success or error details will be displayed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">4.</span>
              <span>If successful, check your inbox (and spam folder) for the test email</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">5.</span>
              <span>Note the response data to debug any issues</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}