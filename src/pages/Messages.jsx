import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Search, User, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Messages() {
  const [selectedThread, setSelectedThread] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Placeholder data - in production, this would come from a real entity
  const threads = [
    {
      id: 1,
      subject: "Welcome to SEF Partnership Portal",
      lastMessage: "We're excited to have you on board!",
      lastMessageDate: new Date(),
      unread: true,
      from: "SEF Team"
    },
    {
      id: 2,
      subject: "Upcoming Event Details",
      lastMessage: "Please review the attached event schedule",
      lastMessageDate: new Date(Date.now() - 86400000),
      unread: false,
      from: "Events Team"
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Communicate with the SEF team and get support</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Thread List */}
          <Card className="lg:col-span-1 border-orange-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversations
              </CardTitle>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedThread?.id === thread.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-sm">{thread.subject}</p>
                      {thread.unread && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                      {thread.lastMessage}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{thread.from}</span>
                      <span className="text-xs text-gray-400">
                        {format(thread.lastMessageDate, 'MMM d')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Message View */}
          <Card className="lg:col-span-2 border-orange-100 shadow-md">
            <CardHeader className="border-b">
              <CardTitle>
                {selectedThread ? selectedThread.subject : 'Select a conversation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {selectedThread ? (
                <>
                  <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <p className="text-sm font-medium mb-1">{selectedThread.from}</p>
                          <p className="text-sm text-gray-700">{selectedThread.lastMessage}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(selectedThread.lastMessageDate, 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t">
                    <div className="flex gap-3">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={3}
                        className="flex-1"
                      />
                      <Button className="bg-gradient-to-r from-orange-500 to-amber-600">
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversation selected</h3>
                    <p className="text-gray-600">Choose a conversation from the list to view messages</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="mt-6 border-blue-100 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Enhanced Messaging Coming Soon</h3>
                <p className="text-sm text-blue-700">
                  Real-time messaging, file attachments, and group conversations will be available soon.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}