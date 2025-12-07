/**
 * Diagnostic Script to Investigate User Role in Supabase
 * 
 * Run this in Node.js or browser console to check your user's role
 * 
 * Usage:
 * 1. Open browser console on your app
 * 2. Copy and paste this entire script
 * 3. Run: await investigateUserRole()
 */

import { supabase } from './src/config/supabase.js';

async function investigateUserRole() {
  console.log('🔍 Investigating User Role...\n');
  
  try {
    // 1. Get current user from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ No authenticated user found:', userError);
      return;
    }
    
    console.log('✅ Current User:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - app_metadata:', JSON.stringify(user.app_metadata, null, 2));
    console.log('  - user_metadata:', JSON.stringify(user.user_metadata, null, 2));
    console.log('');
    
    // 2. Check SUPERADMIN constant
    const SUPERADMIN = {
      uid: '03caabd2-4e51-4a50-9cff-ec66f4aa1011',
      email: 'hayat.malik6@gmail.com',
    };
    
    const isSuperadminByConstant = 
      user.id === SUPERADMIN.uid || 
      user.email?.toLowerCase() === SUPERADMIN.email.toLowerCase();
    
    console.log('🔑 SUPERADMIN Constant Check:');
    console.log('  - Expected UID:', SUPERADMIN.uid);
    console.log('  - Expected Email:', SUPERADMIN.email);
    console.log('  - Your UID matches:', user.id === SUPERADMIN.uid);
    console.log('  - Your Email matches:', user.email?.toLowerCase() === SUPERADMIN.email.toLowerCase());
    console.log('  - Should be superadmin:', isSuperadminByConstant);
    console.log('');
    
    // 3. Check partner_users table
    console.log('📊 Checking partner_users table...');
    const { data: partnerUser, error: partnerUserError } = await supabase
      .from('partner_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    
    if (partnerUserError) {
      console.log('  ⚠️  No record in partner_users table (or error):', partnerUserError.message);
    } else {
      console.log('  ✅ Found in partner_users:');
      console.log('    - Role:', partnerUser.role);
      console.log('    - Partner ID:', partnerUser.partner_id);
      console.log('    - Full Name:', partnerUser.full_name);
      console.log('    - Email:', partnerUser.email);
    }
    console.log('');
    
    // 4. Check all partner_users with your email
    console.log('📧 Checking partner_users by email...');
    const { data: partnerUsersByEmail, error: emailError } = await supabase
      .from('partner_users')
      .select('*')
      .eq('email', user.email);
    
    if (!emailError && partnerUsersByEmail?.length > 0) {
      console.log('  ✅ Found records by email:');
      partnerUsersByEmail.forEach((pu, idx) => {
        console.log(`    Record ${idx + 1}:`);
        console.log(`      - ID: ${pu.id}`);
        console.log(`      - Role: ${pu.role}`);
        console.log(`      - Auth User ID: ${pu.auth_user_id}`);
        console.log(`      - Partner ID: ${pu.partner_id}`);
      });
    } else {
      console.log('  ⚠️  No records found by email');
    }
    console.log('');
    
    // 5. Summary and recommendations
    console.log('📋 SUMMARY:');
    let currentRole = null;
    
    if (isSuperadminByConstant) {
      currentRole = 'superadmin (by constant)';
    } else if (user.app_metadata?.role) {
      currentRole = `app_metadata: ${user.app_metadata.role}`;
    } else if (user.user_metadata?.role) {
      currentRole = `user_metadata: ${user.user_metadata.role}`;
    } else if (partnerUser?.role) {
      currentRole = `partner_users table: ${partnerUser.role}`;
    } else {
      currentRole = 'default: partner';
    }
    
    console.log('  - Current Resolved Role:', currentRole);
    console.log('');
    
    // 6. Recommendations
    console.log('💡 RECOMMENDATIONS:');
    
    if (!isSuperadminByConstant) {
      console.log('  ⚠️  Your email/UID does not match SUPERADMIN constant');
      console.log('     Option 1: Update SUPERADMIN constant in src/constants/users.js');
      console.log('     Option 2: Set role in partner_users table (see SQL below)');
      console.log('     Option 3: Set app_metadata via Edge Function');
    }
    
    if (!partnerUser) {
      console.log('  ⚠️  No record in partner_users table');
      console.log('     Create one with SQL (see below)');
    } else if (partnerUser.role !== 'superadmin' && partnerUser.role !== 'sef_admin') {
      console.log('  ⚠️  Role in partner_users is not superadmin');
      console.log('     Update it with SQL (see below)');
    }
    
    console.log('');
    console.log('🔧 SQL QUERIES TO FIX:');
    console.log('');
    console.log('-- Option 1: Insert/Update partner_users record');
    console.log(`INSERT INTO partner_users (auth_user_id, email, full_name, role, partner_id)`);
    console.log(`VALUES ('${user.id}', '${user.email}', 'Super Admin', 'superadmin', NULL)`);
    console.log(`ON CONFLICT (auth_user_id) DO UPDATE`);
    console.log(`SET role = 'superadmin', email = '${user.email}';`);
    console.log('');
    console.log('-- Option 2: Update existing record');
    console.log(`UPDATE partner_users`);
    console.log(`SET role = 'superadmin'`);
    console.log(`WHERE auth_user_id = '${user.id}';`);
    console.log('');
    console.log('-- Option 3: Check all users');
    console.log(`SELECT id, email, role, auth_user_id FROM partner_users WHERE email = '${user.email}';`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.investigateUserRole = investigateUserRole;
}

export default investigateUserRole;

