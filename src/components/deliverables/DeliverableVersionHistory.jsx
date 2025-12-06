import React from 'react';
import { format } from 'date-fns';
import { FileText, CheckCircle, XCircle, Clock, ExternalLink, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DeliverableVersionHistory({ submissions = [] }) {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        No submission history yet
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { className: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected' },
    };
    const config = configs[status] || { className: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    
    return (
      <Badge className={config.className} variant="outline">
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <Card key={submission.id} className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(submission.status)}
                  <span className="font-semibold text-sm">Version {submission.version || 1}</span>
                  {getStatusBadge(submission.status)}
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="truncate">{submission.file_name || 'Unknown file'}</span>
                  </div>
                  
                  {submission.uploaded_by_user && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>
                        Uploaded by {submission.uploaded_by_user.full_name || submission.uploaded_by_user.email}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    {format(new Date(submission.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                  
                  {submission.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <strong>Rejection reason:</strong> {submission.rejection_reason}
                    </div>
                  )}
                </div>
              </div>
              
              {submission.file_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(submission.file_url, '_blank')}
                  className="flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


