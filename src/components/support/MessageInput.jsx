import React, { useState, useRef } from 'react';
import { Send, Paperclip, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function MessageInput({ onSend, disabled }) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && !file) {
      toast.error('Please enter a message or attach a file');
      return;
    }

    if (disabled || isUploading) return;

    setIsUploading(true);
    try {
      await onSend({
        message: message.trim(),
        file: file
      });
      setMessage('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {file && (
        <div className="mb-3 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <Paperclip className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <label
          htmlFor="file-upload"
          className="cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Paperclip className="w-5 h-5 text-gray-500" />
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
          />
        </label>
        
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={disabled || isUploading}
          className="flex-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-full px-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        
        <Button
          type="submit"
          disabled={(!message.trim() && !file) || disabled || isUploading}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-full h-10 w-10 p-0 shadow-lg"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

