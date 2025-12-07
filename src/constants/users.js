/**
 * User Constants
 * Defines system users and their roles
 * 
 * Superadmins can be identified by UID or email
 * If multiple superadmins, check both UID and email
 */

export const SUPERADMIN = {
  // Primary superadmin (Hayat Malik)
  uid: 'e751fd63-bfb4-4c77-9fc7-9d25adb57406', // Updated to match actual auth user ID
  email: 'hayat.malik6@gmail.com',
};

/**
 * Check if a user is a superadmin
 * @param {Object} user - Supabase auth user object
 * @returns {boolean}
 */
export function isSuperadmin(user) {
  if (!user) return false;
  
  // Check by UID or email
  const superadminEmails = [
    'hayat.malik6@gmail.com',
    'h.malik@sheraa.ae'
  ];
  
  return (
    user.id === SUPERADMIN.uid ||
    superadminEmails.some(email => user.email?.toLowerCase() === email.toLowerCase())
  );
}

