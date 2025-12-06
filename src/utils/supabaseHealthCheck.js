/**
 * Health check utility for Supabase connection
 * Tests CRUD operations to verify database connectivity
 */

import { supabase, isSupabaseConfigured } from '@/config/supabase';
import { partnersService, partnerUsersService } from '@/services/supabaseService';

export async function runHealthCheck() {
  const results = {
    configured: isSupabaseConfigured,
    tests: [],
    success: false,
  };

  if (!isSupabaseConfigured) {
    results.tests.push({
      name: 'Configuration Check',
      status: 'failed',
      message: 'Supabase credentials not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env',
    });
    return results;
  }

  // Test 1: Read partners table
  try {
    const partners = await partnersService.getAll();
    results.tests.push({
      name: 'Read Partners Table',
      status: 'success',
      message: `Successfully read ${partners.length} partner(s)`,
      data: partners.length,
    });
  } catch (error) {
    results.tests.push({
      name: 'Read Partners Table',
      status: 'failed',
      message: error.message,
      error: error,
    });
  }

  // Test 2: Insert sample partner (if none exist)
  try {
    const existingPartners = await partnersService.getAll();
    if (existingPartners.length === 0) {
      const newPartner = await partnersService.create({
        name: 'Health Check Partner',
        tier: 'Gold',
        contract_status: 'Pending',
        assigned_account_manager: 'Test Manager',
      });
      results.tests.push({
        name: 'Insert Partner Record',
        status: 'success',
        message: 'Successfully created test partner',
        data: newPartner.id,
      });

      // Clean up test data
      await partnersService.delete(newPartner.id);
      results.tests.push({
        name: 'Delete Partner Record',
        status: 'success',
        message: 'Successfully deleted test partner',
      });
    } else {
      results.tests.push({
        name: 'Insert Partner Record',
        status: 'skipped',
        message: 'Partners already exist, skipping insert test',
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'Insert Partner Record',
      status: 'failed',
      message: error.message,
      error: error,
    });
  }

  // Test 3: Check auth connection
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    results.tests.push({
      name: 'Supabase Auth Connection',
      status: 'success',
      message: session ? 'Auth connected (user logged in)' : 'Auth connected (no active session)',
    });
  } catch (error) {
    results.tests.push({
      name: 'Supabase Auth Connection',
      status: 'failed',
      message: error.message,
      error: error,
    });
  }

  // Determine overall success
  const failedTests = results.tests.filter(t => t.status === 'failed');
  results.success = failedTests.length === 0;

  return results;
}

export async function displayHealthCheckResults() {
  const results = await runHealthCheck();
  
  console.group('🏥 Supabase Health Check');
  console.log(`Configuration: ${results.configured ? '✅ Configured' : '❌ Not Configured'}`);
  
  results.tests.forEach(test => {
    const icon = test.status === 'success' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
    console.log(`${icon} ${test.name}: ${test.message}`);
    if (test.error) {
      console.error('Error details:', test.error);
    }
  });
  
  console.log(`\nOverall: ${results.success ? '✅ All tests passed' : '❌ Some tests failed'}`);
  console.groupEnd();
  
  return results;
}



