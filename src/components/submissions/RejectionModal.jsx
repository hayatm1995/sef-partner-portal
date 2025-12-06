import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";

export default function RejectionModal({ 
  open, 
  onClose, 
  onSubmit, 
  isSubmitting,
  submissionName 
}) {
  const [rejectionReason, setRejectionReason] = useState("");

  const handleSubmit = () => {
    if (!rejectionReason.trim()) {
      return; // Don't submit if reason is empty
    }
    onSubmit(rejectionReason.trim());
    setRejectionReason(""); // Reset after submit
  };

  const handleClose = () => {
    setRejectionReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            Reject Submission
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Please provide a reason for rejecting this submission:
            </p>
            {submissionName && (
              <p className="text-sm font-medium text-gray-900 mb-4">
                Submission: <span className="text-orange-600">{submissionName}</span>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., File format not supported, missing required information, quality issues..."
              rows={4}
              className="resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              This reason will be visible to the partner.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !rejectionReason.trim()}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Reject Submission"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


