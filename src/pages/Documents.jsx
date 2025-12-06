import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FolderOpen,
  FileText,
  Download,
  Search,
  Star,
  Clock,
  FileCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Placeholder document categories
  const documentCategories = [
    { id: "contracts", name: "Contracts & Agreements", icon: FileCheck, count: 3 },
    { id: "guidelines", name: "Brand Guidelines", icon: Star, count: 5 },
    { id: "templates", name: "Templates", icon: FileText, count: 8 },
    { id: "policies", name: "Policies & Procedures", icon: FolderOpen, count: 4 }
  ];

  // Placeholder documents
  const documents = [
    {
      id: 1,
      name: "Partnership Agreement 2024",
      category: "contracts",
      size: "2.4 MB",
      uploadDate: new Date(),
      type: "PDF"
    },
    {
      id: 2,
      name: "SEF Brand Guidelines",
      category: "guidelines",
      size: "5.1 MB",
      uploadDate: new Date(Date.now() - 86400000),
      type: "PDF"
    },
    {
      id: 3,
      name: "Workshop Submission Template",
      category: "templates",
      size: "156 KB",
      uploadDate: new Date(Date.now() - 172800000),
      type: "DOCX"
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
          <p className="text-gray-600">Access important files, templates, and resources</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 border-orange-100">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {documentCategories.map((category) => (
            <motion.div
              key={category.id}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Card className="border-orange-100 shadow-md hover:shadow-xl transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{category.name}</h3>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700">
                    {category.count} documents
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Documents */}
        <Card className="border-orange-100 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{doc.name}</h4>
                      <p className="text-sm text-gray-600">
                        {doc.type} • {doc.size} • {format(doc.uploadDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="mt-6 border-blue-100 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Full Document Library Coming Soon</h3>
                <p className="text-sm text-blue-700">
                  Advanced search, version control, and folder organization features are being developed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}