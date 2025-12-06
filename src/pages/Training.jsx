import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Video,
  FileText,
  Award,
  Play,
  CheckCircle,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

export default function Training() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Placeholder training modules
  const trainingModules = [
    {
      id: 1,
      title: "Getting Started with SEF Partnership",
      description: "Learn the basics of your partnership and portal navigation",
      type: "video",
      duration: "15 min",
      completed: true,
      progress: 100
    },
    {
      id: 2,
      title: "Submitting Deliverables",
      description: "Step-by-step guide to uploading and managing your files",
      type: "guide",
      duration: "10 min",
      completed: false,
      progress: 60
    },
    {
      id: 3,
      title: "Nomination Best Practices",
      description: "How to submit effective nominations for speakers and startups",
      type: "video",
      duration: "20 min",
      completed: false,
      progress: 0
    },
    {
      id: 4,
      title: "Booth Setup & Activation Guidelines",
      description: "Everything you need to know about booth setup and requirements",
      type: "document",
      duration: "12 min",
      completed: false,
      progress: 0
    }
  ];

  const getTypeIcon = (type) => {
    const icons = {
      video: Video,
      guide: BookOpen,
      document: FileText
    };
    return icons[type] || BookOpen;
  };

  const completedCount = trainingModules.filter(m => m.completed).length;
  const completionPercentage = (completedCount / trainingModules.length) * 100;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training & Guides</h1>
          <p className="text-gray-600">Learn how to make the most of your partnership</p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8 border-orange-100 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Progress</h3>
                <p className="text-sm text-gray-600">
                  {completedCount} of {trainingModules.length} modules completed
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                <Award className="w-8 h-8 text-white" />
              </div>
            </div>
            <Progress value={completionPercentage} className="h-3" />
            <p className="text-sm text-gray-600 mt-2">{Math.round(completionPercentage)}% complete</p>
          </CardContent>
        </Card>

        {/* Training Modules */}
        <div className="space-y-4">
          {trainingModules.map((module) => {
            const TypeIcon = getTypeIcon(module.type);
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card className="border-orange-100 shadow-md hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${
                        module.completed 
                          ? 'bg-green-100' 
                          : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}>
                        {module.completed ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <TypeIcon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-lg mb-1">{module.title}</h3>
                            <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="capitalize">
                                {module.type}
                              </Badge>
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {module.duration}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant={module.completed ? "outline" : "default"}
                            className={!module.completed ? "bg-gradient-to-r from-orange-500 to-amber-600" : ""}
                          >
                            {module.completed ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Review
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                {module.progress > 0 ? 'Continue' : 'Start'}
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {module.progress > 0 && !module.completed && (
                          <div className="mt-3">
                            <Progress value={module.progress} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">{module.progress}% complete</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Coming Soon Notice */}
        <Card className="mt-8 border-blue-100 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">More Training Content Coming Soon</h3>
                <p className="text-sm text-blue-700">
                  Interactive quizzes, video tutorials, and certification programs are being developed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}