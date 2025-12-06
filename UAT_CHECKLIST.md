# User Acceptance Testing (UAT) Checklist

## Phase 1: Exhibitor ↔ Partner Mapping

### Admin Exhibitor Panel
- [ ] Admin can view all booths in AdminBooths page
- [ ] Admin can assign a partner to a booth via "Assign Partner" button
- [ ] Partner selection dropdown shows all available partners
- [ ] System prevents assigning multiple partners to same booth (unless override enabled)
- [ ] Assignment status updates correctly
- [ ] Partner assignment appears in booth details

### Partner Portal
- [ ] Partner can see assigned booth in ExhibitorStand page
- [ ] Partner can select "SEF Builds Booth" option
- [ ] Partner can select "Self-Build Booth" option
- [ ] Build option selection persists after page refresh
- [ ] Required deliverables update based on build option selection
- [ ] Status tracking shows correct assignment/build selection state

## Phase 2: Deliverables Workflow + Approvals

### Partner UI
- [ ] Partner can upload files for deliverables
- [ ] Partner can submit external links for deliverables
- [ ] File upload shows progress indicator
- [ ] Submission form validates required fields
- [ ] Multiple file types are accepted (PDF, images, etc.)
- [ ] File size limits are enforced
- [ ] Submission status shows as "Pending Review" after upload

### Admin UI
- [ ] Admin can view all submissions in AdminSubmissions page
- [ ] Admin can filter submissions by status (pending, approved, rejected, changes requested)
- [ ] Admin can approve a submission
- [ ] Admin can reject a submission with reason
- [ ] Admin can request changes with notes
- [ ] Status badges show correct colors and labels
- [ ] Timestamps display correctly
- [ ] Rejection/changes comments are visible to partner

### Notifications
- [ ] Partner receives in-app notification when submission is approved
- [ ] Partner receives in-app notification when submission is rejected
- [ ] Partner receives in-app notification when changes are requested
- [ ] Admin receives in-app notification when new submission is uploaded
- [ ] Email notifications are sent (if configured)
- [ ] Notification metadata includes submission details

## Phase 3: Messaging System

### Admin Chat
- [ ] Admin can view all partners in AdminMessages page
- [ ] Admin can select a partner to start conversation
- [ ] Admin can send messages to partners
- [ ] Messages appear in real-time (no refresh needed)
- [ ] Unread message count displays correctly
- [ ] Admin can see which messages are read/unread

### Partner Chat
- [ ] Partner can view messages from admin in Messages page
- [ ] Partner can reply to admin messages
- [ ] Messages appear in real-time
- [ ] Unread indicators show correctly
- [ ] Message timestamps display correctly
- [ ] Chat history persists after page refresh

## Phase 4: AI Assistance

### Booth Content Generation
- [ ] "Suggest copy" button appears in booth view
- [ ] AI generates relevant text for signage
- [ ] AI generates product descriptions
- [ ] Generated content can be copied/used
- [ ] Safety guardrails prevent harmful content

### Reminder Content
- [ ] Admin can generate personalized reminders
- [ ] Reminders are based on partner progress
- [ ] Generated reminders are relevant and helpful

### Image Helpers
- [ ] Image resize suggestions work (if implemented)
- [ ] Image compression suggestions work (if implemented)
- [ ] Logo optimization suggestions work (if implemented)

## Phase 5: Admin Control Room

### Status Heatmap
- [ ] Control room accessible only to superadmins
- [ ] Heatmap shows partners who haven't submitted deliverables
- [ ] Heatmap shows partners who haven't chosen booth build option
- [ ] Statistics display correctly (total partners, completion rates)
- [ ] Booth build option statistics are accurate
- [ ] Unread message counts are accurate

### Export Features
- [ ] CSV export button works
- [ ] Exported CSV contains correct data
- [ ] CSV format is readable in Excel/Google Sheets
- [ ] All partner data is included in export

### Activity Log
- [ ] Activity log shows recent partner actions
- [ ] Activity log entries are accurate
- [ ] Activity log is filterable/searchable

## Phase 6: Belong+ & VIP Guest Lists

### Admin VIP Management
- [ ] Admin can view all VIP invitations in VIPApprovals page
- [ ] Admin can filter by event type and status
- [ ] Admin can approve VIP invitations
- [ ] Admin can reject VIP invitations with reason
- [ ] Admin can allocate guest slots per partner

### Partner VIP Submission
- [ ] Partner can submit guest names and emails
- [ ] Partner can see allocated guest slots
- [ ] Partner can see submission status
- [ ] Partner receives notifications on approval/rejection

### QR Code Generation
- [ ] QR codes are generated for confirmed guests
- [ ] QR codes can be downloaded/printed
- [ ] QR codes contain correct guest information
- [ ] QR codes are scannable and valid

## Phase 7: Deployment & Testing

### Production Environment
- [ ] Application deploys successfully to Vercel
- [ ] Environment variables are configured correctly
- [ ] Custom domain (sefpartners.sheraa.ae) is configured
- [ ] SSL certificate is active
- [ ] Site loads without errors

### Performance
- [ ] Page load times are acceptable (< 3 seconds)
- [ ] Real-time features work without lag
- [ ] File uploads complete successfully
- [ ] Database queries are optimized

### Security
- [ ] RLS policies prevent unauthorized access
- [ ] Admin routes require authentication
- [ ] Partner routes show only partner data
- [ ] API keys are not exposed in client code
- [ ] File uploads validate file types

### Analytics & Error Logging
- [ ] Analytics tracking is enabled (if configured)
- [ ] Error logging captures issues (if configured)
- [ ] Error messages are user-friendly

## Cross-Phase Testing

### User Roles
- [ ] Partner users can only access partner routes
- [ ] Admin users can access admin routes
- [ ] Superadmin users can access control room
- [ ] Unauthorized access attempts are blocked

### Data Integrity
- [ ] Partner data is isolated correctly
- [ ] Admin can view all partner data
- [ ] Submissions are linked to correct deliverables
- [ ] Messages are linked to correct partners
- [ ] Activity logs are accurate

### Real-time Features
- [ ] Messages update in real-time
- [ ] Notifications appear without refresh
- [ ] Submission status updates in real-time
- [ ] No memory leaks from subscriptions

### Mobile Responsiveness
- [ ] All pages work on mobile devices
- [ ] Forms are usable on mobile
- [ ] Tables are scrollable on mobile
- [ ] Navigation works on mobile

## Known Issues & Notes

Document any issues found during testing:

1. 
2. 
3. 

## Sign-off

- [ ] All critical features tested and working
- [ ] All blockers resolved
- [ ] Ready for production deployment

**Tester Name:** _________________  
**Date:** _________________  
**Approved by:** _________________

