# Supabase Integration - Setup Guide

## ✅ Completed Integration

This document outlines the Supabase integration that has been implemented.

---

## 📊 Database Schema

### Migration File
Location: `supabase/migrations/001_initial_schema.sql`

### Tables Created:

1. **partners** - Partner organization data
2. **partner_users** - User accounts linked to partners
3. **exhibitor_stands** - Exhibition booth management
4. **deliverables** - File uploads and submissions
5. **nominations** - Speaker, judge, startup nominations
6. **notifications** - In-app notifications

### Features:
- ✅ UUID primary keys
- ✅ Foreign key relationships
- ✅ Check constraints for status fields
- ✅ Automatic `updated_at` timestamps
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance

---

## 🔧 Setup Instructions

### 1. Run Database Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the migration
5. Verify tables are created in **Table Editor**

### 2. Configure Environment Variables

Create/update your `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=http://localhost:5173
VITE_BASE44_APP_ID=68f50edf823231efaa8f1c55
```

### 3. Enable Authentication Providers

In Supabase Dashboard → Authentication → Providers:

- ✅ **Email** - Already enabled
- ✅ **Magic Link** - Enable in provider settings
- ✅ **Google** - Configure OAuth credentials
- ✅ **Microsoft/Azure** - Configure OAuth credentials

---

## 📁 Code Structure

### New Files Created:

1. **`src/services/supabaseService.js`**
   - Centralized Supabase query functions
   - Services for: partners, partner_users, exhibitor_stands, deliverables, nominations, notifications

2. **`src/config/supabase.js`**
   - Supabase client configuration
   - Handles missing credentials gracefully

3. **`src/contexts/AuthContext.jsx`** (Updated)
   - Real Supabase authentication
   - Fetches partner data on login
   - Supports: email/password, magic link, Google, Microsoft
   - Test user login (dev only)

4. **`src/pages/Login.jsx`** (Updated)
   - Multiple login methods
   - Magic link support
   - OAuth buttons

### Updated Files:

- **`src/pages/Layout.jsx`** - Uses Supabase auth
- **`src/pages/Dashboard.jsx`** - Uses Supabase data
- **`src/pages/Deliverables.jsx`** - Uses Supabase data
- **`src/pages/Nominations.jsx`** - Uses Supabase data
- **`src/pages/ExhibitorStand.jsx`** - Uses Supabase data
- **`src/components/notifications/GlobalNotificationBell.jsx`** - Uses Supabase data

---

## 🔐 Authentication Flow

1. User logs in via Supabase Auth (email/password, magic link, OAuth)
2. `AuthContext` fetches `partner_users` record by email
3. If found, fetches associated `partners` record
4. User object enriched with partner data
5. Role-based access control based on `partner_users.role`

### User Roles:
- `admin` - Full access, can view all partners
- `marketing` - Marketing-focused access
- `operations` - Operations-focused access
- `viewer` - Read-only access

---

## 📝 Example Supabase Queries

### Get All Partners (Admin)
```javascript
import { partnersService } from '@/services/supabaseService';
const partners = await partnersService.getAll();
```

### Get Partner Deliverables
```javascript
import { deliverablesService } from '@/services/supabaseService';
const deliverables = await deliverablesService.getAll(partnerId);
```

### Create Deliverable
```javascript
const newDeliverable = await deliverablesService.create({
  partner_id: partnerId,
  name: 'Company Logo',
  type: 'Media Asset',
  status: 'Pending Review',
  file_url: 'https://...',
});
```

### Update Deliverable Status
```javascript
await deliverablesService.update(deliverableId, {
  status: 'Approved',
  notes: 'Looks great!',
});
```

---

## 🎯 Data Flow

### Partner View:
1. User logs in → `AuthContext` fetches `partner_users` → Gets `partner_id`
2. All queries filtered by `partner_id`
3. User sees only their partner's data

### Admin View:
1. User with `role: 'admin'` logs in
2. Queries return all data (no filter)
3. Can use "View as Partner" to see specific partner view

---

## ⚠️ Important Notes

1. **Contracts Table**: Currently still uses Base44. Add to Supabase schema if needed:
   ```sql
   CREATE TABLE contracts (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     partner_id UUID REFERENCES partners(id),
     title TEXT,
     status TEXT,
     file_url TEXT,
     ...
   );
   ```

2. **File Uploads**: Currently using Base44 file storage. Consider migrating to Supabase Storage:
   - Create bucket in Supabase Storage
   - Update file upload components to use `supabase.storage`

3. **Test User Login**: Still available for development
   - Creates mock user with `role: 'admin'`
   - Bypasses Supabase authentication

4. **Base44 Entities**: Some entities still use Base44 (ActivityLog, etc.)
   - Can be migrated to Supabase as needed
   - Current implementation supports both

---

## 🧪 Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Add Supabase credentials to `.env`
- [ ] Test email/password login
- [ ] Test magic link login
- [ ] Test Google OAuth (if configured)
- [ ] Test Microsoft OAuth (if configured)
- [ ] Test admin dashboard shows all partners
- [ ] Test partner dashboard shows only their data
- [ ] Test deliverables upload and status
- [ ] Test nominations submission
- [ ] Test exhibitor stand status
- [ ] Test notifications display

---

## 📚 Next Steps

1. **Add Sample Data**: Insert test partners and users
2. **Configure OAuth**: Set up Google/Microsoft credentials
3. **File Storage**: Migrate to Supabase Storage
4. **Additional Tables**: Add contracts, activity_log, etc.
5. **RLS Policies**: Refine security policies as needed

---

**Status**: ✅ Core integration complete. Ready for testing with real Supabase instance.



