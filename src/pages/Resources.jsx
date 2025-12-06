import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  Search,
  Star,
  Folder,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const resourceCategories = [
    { id: "brand", name: "Brand Assets", icon: ImageIcon, count: 12, color: "from-blue-500 to-blue-600" },
    { id: "templates", name: "Templates", icon: FileText, count: 8, color: "from-purple-500 to-purple-600" },
    { id: "guides", name: "Partner Guides", icon: Folder, count: 15, color: "from-green-500 to-green-600" },
    { id: "videos", name: "Video Tutorials", icon: Video, count: 6, color: "from-orange-500 to-amber-600" }
  ];

  const resources = [
    {
      id: 1,
      title: "SEF Logo Package",
      description: "High-resolution logos in multiple formats (PNG, SVG, AI)",
      category: "brand",
      type: "ZIP",
      size: "12.4 MB",
      featured: true
    },
    {
      id: 2,
      title: "Workshop Submission Template",
      description: "Template for submitting workshop proposals",
      category: "templates",
      type: "DOCX",
      size: "156 KB",
      featured: true
    },
    {
      id: 3,
      title: "Partner Handbook 2024",
      description: "Complete guide to your partnership benefits and responsibilities",
      category: "guides",
      type: "PDF",
      size: "3.2 MB",
      featured: true
    },
    {
      id: 4,
      title: "Media Kit",
      description: "Official SEF media kit with photos, logos, and press materials",
      category: "brand",
      type: "ZIP",
      size: "45.8 MB",
      featured: false
    },
    {
      id: 5,
      title: "Nomination Form Template",
      description: "Template for speaker and startup nominations",
      category: "templates",
      type: "XLSX",
      size: "89 KB",
      featured: false
    },
    {
      id: 6,
      title: "Getting Started Tutorial",
      description: "Video walkthrough of the partner portal",
      category: "videos",
      type: "MP4",
      size: "125 MB",
      featured: true
    }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || resource.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredResources = resources.filter(r => r.featured);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resources & Downloads</h1>
          <p className="text-gray-600">Access templates, brand assets, and partnership guides</p>
        </div>

        {/* Search */}
        <Card className="mb-6 border-orange-100">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Featured Resources */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-orange-500" />
            Featured Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredResources.map((resource) => (
              <motion.div
                key={resource.id}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <Card className="border-orange-100 shadow-md hover:shadow-xl transition-all h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 mb-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{resource.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{resource.type} • {resource.size}</Badge>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {resourceCategories.map((category) => (
            <motion.div
              key={category.id}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Card 
                className={`border-orange-100 shadow-md hover:shadow-xl transition-all cursor-pointer ${
                  activeCategory === category.id ? 'ring-2 ring-orange-500' : ''
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{category.name}</h3>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700">
                    {category.count} resources
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* All Resources */}
        <Card className="border-orange-100 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Resources</CardTitle>
            {activeCategory !== "all" && (
              <Button variant="outline" size="sm" onClick={() => setActiveCategory("all")}>
                Show All
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 truncate">{resource.title}</h4>
                      <p className="text-sm text-gray-600 truncate">{resource.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {resource.type} • {resource.size}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="flex-shrink-0">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>

            {filteredResources.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
                <p className="text-gray-600">Try adjusting your search or category filter</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-8 border-blue-100 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Need a specific resource?</h3>
                <p className="text-sm text-blue-700">
                  Contact your account manager if you can't find what you're looking for.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}