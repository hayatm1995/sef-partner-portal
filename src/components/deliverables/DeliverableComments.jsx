import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { deliverableCommentsService } from '@/services/supabaseService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { MessageSquare, Send, User, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function DeliverableComments({ deliverableId, submissionId = null }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);

  // Determine if user is admin
  const isAdmin = user?.is_admin || user?.is_super_admin;

  // Fetch comments
  const queryKey = submissionId 
    ? ['deliverableComments', deliverableId, submissionId]
    : ['deliverableComments', deliverableId];
  
  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (submissionId) {
        return deliverableCommentsService.getBySubmissionId(submissionId);
      }
      return deliverableCommentsService.getByDeliverableId(deliverableId);
    },
    enabled: !!deliverableId,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!deliverableId || !open) return;

    const filter = submissionId 
      ? `deliverable_id=eq.${deliverableId} AND submission_id=eq.${submissionId}`
      : `deliverable_id=eq.${deliverableId}`;

    const channel = supabase
      .channel(`deliverable_comments:${deliverableId}${submissionId ? `:${submissionId}` : ''}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliverable_comments',
          filter: filter,
        },
        (payload) => {
          console.log('Real-time comment update:', payload);
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [deliverableId, submissionId, queryClient, queryKey, open]);

  // Scroll to bottom when comments change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Send comment mutation
  const sendCommentMutation = useMutation({
    mutationFn: async (messageText) => {
      if (!deliverableId || !user?.partner_user?.id) {
        throw new Error('Missing required data');
      }

      return await deliverableCommentsService.create({
        deliverable_id: deliverableId,
        submission_id: submissionId || null,
        user_id: user.partner_user.id,
        message: messageText,
        is_admin: isAdmin,
      });
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      console.error('Send comment error:', error);
      toast.error('Failed to send comment: ' + (error.message || 'Unknown error'));
    },
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      await sendCommentMutation.mutateAsync(message.trim());
    } catch (error) {
      // Error handled in mutation
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Comments List */}
        <ScrollArea className="h-[300px] p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
              <span className="ml-3 text-gray-600">Loading comments...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No comments yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const isOwnComment = comment.user_id === user?.partner_user?.id;
                
                return (
                  <div
                    key={comment.id}
                    className={`flex gap-3 ${isOwnComment ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        comment.is_admin
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-orange-100 text-orange-600'
                      }`}
                    >
                      {comment.is_admin ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`flex-1 min-w-0 ${
                        isOwnComment ? 'items-end' : 'items-start'
                      } flex flex-col`}
                    >
                      <div
                        className={`rounded-lg p-3 max-w-[80%] ${
                          comment.is_admin
                            ? 'bg-blue-100 text-blue-900'
                            : isOwnComment
                            ? 'bg-orange-100 text-orange-900'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">
                            {comment.user?.full_name || comment.user?.email || 'Unknown User'}
                          </span>
                          {comment.is_admin && (
                            <Badge variant="outline" className="text-xs bg-blue-200 text-blue-800">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{comment.message}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 px-1">
                        {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Comment Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="resize-none"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={!message.trim() || sending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

