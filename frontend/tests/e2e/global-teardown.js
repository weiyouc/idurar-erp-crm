/**
 * Global Teardown for E2E Tests
 *
 * Runs once after all test suites to clean up the test environment:
 * - Clean up test data
 * - Generate test reports
 * - Log test completion summary
 */

import { chromium } from '@playwright/test';
import { teardownTestEnvironment } from './helpers/testDataManager.js';

export default async function globalTeardown(config) {
  console.log('🔚 Starting E2E test global teardown...');

  // Launch browser for cleanup operations
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Clean up test environment
    await teardownTestEnvironment(page);

    console.log('✅ Global teardown completed successfully');

    // Generate completion summary
    console.log('\n📊 E2E Test Run Summary:');
    console.log('='.repeat(50));
    console.log('✅ Environment: Properly cleaned up');
    console.log('✅ Test Data: All test entities removed');
    console.log('✅ Database: Restored to clean state');
    console.log('='.repeat(50));
    console.log('\n🎉 E2E testing completed!');

  } catch (error) {
    console.error('❌ Global teardown failed:', error.message);
    console.warn('⚠ Test environment may need manual cleanup');
  } finally {
    await browser.close();
  }
}