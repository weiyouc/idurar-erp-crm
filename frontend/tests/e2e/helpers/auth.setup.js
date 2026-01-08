/**
 * Authentication Setup for Tests
 * 
 * Provides authenticated context for tests that require login
 */

import { test as setup } from '@playwright/test';
import { login } from './testHelpers';

/**
 * Setup authenticated state for tests
 * Creates a storage state file that can be reused across tests
 */
setup('authenticate', async ({ page }) => {
  // Login with admin credentials
  await login(page, 'admin@admin.com', 'admin123');
  
  // Save authenticated state
  await page.context().storageState({ path: 'tests/e2e/.auth/admin.json' });
});

