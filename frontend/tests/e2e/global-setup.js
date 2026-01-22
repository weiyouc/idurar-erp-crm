/**
 * Global Setup for E2E Tests
 *
 * Runs once before all test suites to prepare the test environment:
 * - Verify backend is running
 * - Seed test data
 * - Verify frontend is accessible
 */

import { chromium } from '@playwright/test';
import { setupTestEnvironment, verifySeedData } from './helpers/testDataManager.js';

export default async function globalSetup(config) {
  console.log('🚀 Starting E2E test global setup...');

  // Launch browser for setup operations
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Verify backend connectivity (assuming backend is on port 8888)
    console.log('🔍 Checking backend connectivity...');
    try {
      const backendResponse = await page.request.get('http://localhost:8888/api/health');
      if (backendResponse.ok()) {
        console.log('✅ Backend is accessible');
      } else {
        console.warn('⚠ Backend health check failed, but continuing...');
      }
    } catch (error) {
      console.warn('⚠ Could not verify backend connectivity:', error.message);
    }

    // Setup test environment
    await setupTestEnvironment(page);

    // Verify frontend is accessible
    console.log('🔍 Checking frontend accessibility...');
    try {
      await page.goto('http://localhost:3000', { timeout: 30000 });
      const title = await page.title();
      console.log(`✅ Frontend accessible - Title: ${title}`);
    } catch (error) {
      console.error('❌ Frontend not accessible:', error.message);
      throw new Error('Frontend is not accessible. Make sure the dev server is running.');
    }

    console.log('✅ Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}