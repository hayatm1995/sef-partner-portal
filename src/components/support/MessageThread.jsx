import React, { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Download, File, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function MessageThread({ messages, currentUserRole }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getMessageAlignment = (senderRole) => {
    return senderRole === currentUserRole ? 'justify-end' : 'justify-start';
  };

  const getMessageBubbleStyle = (senderRole) => {
    if (senderRole === 'admin') {
      return 'bg-gradient-to-br from-orange-500 to-orange-600 text-white';
    }
    return 'bg-white border border-gray-200 text-gray-900';
  };

  const getSenderName = (senderRole) => {
    return senderRole === 'admin' ? 'Admin' : 'You';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-center">
            No messages yet. Start the conversation!
          </p>
        </div>
      ) : (
        messages.map((message) => {
          const isCurrentUser = message.sender_role === currentUserRole;
          const alignment = getMessageAlignment(message.sender_role);
          
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${alignment}`}
            >
              {!isCurrentUser && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-semibold text-orange-600">
                    {message.sender_role === 'admin' ? 'A' : 'P'}
                  </span>
                </div>
              )}
              
              <div className={`max-w-[75%] ${isCurrentUser && 'flex flex-col items-end'}`}>
                {!isCurrentUser && (
                  <p className="text-xs text-gray-500 mb-1 ml-1">
                    {getSenderName(message.sender_role)}
                  </p>
                )}
                
                <div
                  className={`rounded-2xl px-4 py-3 shadow-sm ${
                    message.sender_role === 'admin'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                      : 'bg-white border border-gray-200'
                  } ${!message.is_read && message.sender_role !== currentUserRole ? 'ring-2 ring-orange-300' : ''}`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.message}
                  </p>
                  
                  {message.file_url && (
                    <div className="mt-2">
                      <a
                        href={message.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        {message.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <ImageIcon className="w-4 h-4" />
                        ) : (
                          <File className="w-4 h-4" />
                        )}
                        <span className="text-xs font-medium">
                          {message.file_url.split('/').pop()}
                        </span>
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  
                  <p className={`text-xs mt-2 ${
                    message.sender_role === 'admin'
                      ? 'text-orange-100'
                      : 'text-gray-500'
                  }`}>
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              {isCurrentUser && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-semibold text-orange-600">
                    {currentUserRole === 'admin' ? 'A' : 'P'}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

