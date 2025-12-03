import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, HelpCircle } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PageNotFound() {
  const navigate = useNavigate();

  const quickLinks = [
    { label: "Dashboard", path: createPageUrl("Dashboard"), icon: Home },
    { label: "Partner Hub", path: createPageUrl("PartnerHub"), icon: Search },
    { label: "Support", path: createPageUrl("Support"), icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <Card className="border-2 border-gray-200 shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="mb-8">
              <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                404
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
              <p className="text-gray-600 max-w-md mx-auto">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            <div className="flex gap-3 justify-center mb-8">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="bg-gradient-to-r from-blue-600 to-purple-600 gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </Button>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-4">Quick Links</p>
              <div className="flex gap-3 justify-center flex-wrap">
                {quickLinks.map((link) => (
                  <Button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}