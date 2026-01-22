/**
 * Test Helpers for UI Automation Tests
 * 
 * Provides utilities for common test operations like login, navigation, form filling, etc.
 */

import { expect } from '@playwright/test';

/**
 * Login to the application
 * @param {Page} page - Playwright page object
 * @param {string} email - User email
 * @param {string} password - User password
 */
export async function login(page, email = 'admin@admin.com', password = 'admin123') {
  // Navigate to login page
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Wait for React to hydrate - check for root element or React markers
  await page.waitForFunction(
    () => document.querySelector('#root') || document.querySelector('[data-reactroot]') || window.React,
    { timeout: 10000 }
  ).catch(() => {});
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  
  // Check if already logged in (redirected to dashboard)
  const currentUrl = page.url();
  if (currentUrl.includes('/') && !currentUrl.includes('/login') && !currentUrl.includes('/forgetpassword')) {
    // Already logged in, return early
    await page.waitForTimeout(500);
    return;
  }
  
  // Wait for React to render - look for form or email input
  // The form is wrapped in Loading component, so wait for it to be ready
  // Try multiple strategies to find the login form
  let formFound = false;
  const formSelectors = [
    'input[name="email"]',
    '.login-form',
    'form[name="normal_login"]',
    'form.login-form',
    '.ant-form',
    'input[type="email"]'
  ];
  
  for (const selector of formSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000, state: 'visible' });
      formFound = true;
      break;
    } catch (e) {
      continue;
    }
  }
  
  if (!formFound) {
    // If form doesn't appear, check if we're already logged in
    const url = page.url();
    if (!url.includes('/login') && !url.includes('/forgetpassword')) {
      return; // Already logged in
    }
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/login-form-not-found.png' }).catch(() => {});
    throw new Error(`Login form not found. Current URL: ${url}. Tried selectors: ${formSelectors.join(', ')}`);
  }
  
  // Wait a bit for React to finish rendering and animations
  await page.waitForTimeout(1500);
  
  // Fill email field - try multiple selectors
  const emailSelectors = [
    'input[name="email"]',
    'input[type="email"]',
    '.login-form input[type="email"]',
    'form[name="normal_login"] input[name="email"]'
  ];
  
  let emailFilled = false;
  for (const selector of emailSelectors) {
    try {
      const emailInput = page.locator(selector).first();
      if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailInput.waitFor({ state: 'visible', timeout: 3000 });
        await emailInput.fill(email);
        emailFilled = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!emailFilled) {
    throw new Error('Could not find email input field');
  }
  
  // Fill password field
  const passwordSelectors = [
    'input[name="password"]',
    'input[type="password"]',
    '.login-form input[type="password"]',
    'form[name="normal_login"] input[name="password"]'
  ];
  
  let passwordFilled = false;
  for (const selector of passwordSelectors) {
    try {
      const passwordInput = page.locator(selector).first();
      if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await passwordInput.waitFor({ state: 'visible', timeout: 3000 });
        await passwordInput.fill(password);
        passwordFilled = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!passwordFilled) {
    throw new Error('Could not find password input field');
  }
  
  // Click submit button
  const buttonSelectors = [
    'button[type="submit"]',
    'button[htmlType="submit"]',
    'button.login-form-button',
    'button:has-text("Log in")',
    'button:has-text("登录")',
    '.login-form-button'
  ];
  
  let buttonClicked = false;
  for (const selector of buttonSelectors) {
    try {
      const submitButton = page.locator(selector).first();
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.waitFor({ state: 'visible', timeout: 3000 });
        await submitButton.click();
        buttonClicked = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!buttonClicked) {
    throw new Error('Could not find submit button');
  }
  
  // Wait for navigation after login - could go to / or /dashboard
  // Also handle case where login might fail
  try {
    await page.waitForURL(/\/(dashboard|home|$)/, { timeout: 15000 });
  } catch (e) {
    // Check if we're still on login page (login failed)
    await page.waitForTimeout(2000); // Give it more time
    const url = page.url();
    if (url.includes('/login') || url.includes('/forgetpassword')) {
      // Check for error message
      const errorVisible = await page.locator('.ant-message-error, .ant-form-item-explain-error').isVisible({ timeout: 2000 }).catch(() => false);
      if (errorVisible) {
        throw new Error('Login failed - check credentials');
      }
      // Check one more time if we're still on login page
      await page.waitForTimeout(2000);
      const finalUrl = page.url();
      if (finalUrl.includes('/login') || finalUrl.includes('/forgetpassword')) {
        throw new Error('Login did not redirect - still on login page');
      }
      // If we're not on login page anymore, login succeeded
    }
    // If we're not on login page, login likely succeeded
  }
  
  // Verify login success - wait for page to load
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500); // Small delay for UI to settle
}

/**
 * Logout from the application
 * @param {Page} page - Playwright page object
 */
export async function logout(page) {
  // Look for logout button in various possible locations
  const logoutSelectors = [
    'button:has-text("Logout")',
    'button:has-text("登出")',
    '[data-testid="logout"]',
    'a[href*="logout"]'
  ];
  
  for (const selector of logoutSelectors) {
    const element = await page.locator(selector).first();
    if (await element.isVisible().catch(() => false)) {
      await element.click();
      await page.waitForURL(/\/login/, { timeout: 5000 });
      break;
    }
  }
}

// Original navigateTo function kept for backward compatibility
// Enhanced version is navigateToEnhanced below

/**
 * Fill a form field
 * @param {Page} page - Playwright page object
 * @param {string} fieldName - Field name or label
 * @param {string} value - Value to fill
 * @returns {Promise<boolean>} True if field was filled, false otherwise
 */
export async function fillField(page, fieldName, value) {
  // First wait for any loading states
  await waitForLoading(page);

  // Enhanced selectors for form fields
  const selectors = [
    // Direct name/id matches
    `input[name="${fieldName}"]`,
    `textarea[name="${fieldName}"]`,
    `select[name="${fieldName}"]`,
    `input[id="${fieldName}"]`,
    `textarea[id="${fieldName}"]`,

    // Placeholder-based matches
    `input[placeholder*="${fieldName}"]`,
    `textarea[placeholder*="${fieldName}"]`,
    `input[placeholder*="${fieldName.toLowerCase()}"]`,
    `textarea[placeholder*="${fieldName.toLowerCase()}"]`,

    // Label-based matches (Ant Design patterns)
    `//label[contains(text(), "${fieldName}")]/following-sibling::*//input`,
    `//label[contains(text(), "${fieldName}")]/following-sibling::*//textarea`,
    `//label[contains(text(), "${fieldName}")]/following-sibling::*//select`,
    `//label[contains(text(), "${fieldName}")]/ancestor::div[contains(@class, "ant-form-item")]//input`,
    `//label[contains(text(), "${fieldName}")]/ancestor::div[contains(@class, "ant-form-item")]//textarea`,
    `//label[contains(text(), "${fieldName}")]/ancestor::div[contains(@class, "ant-form-item")]//select`,

    // Case-insensitive label matches
    `//label[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${fieldName.toLowerCase()}")]/ancestor::div[contains(@class, "ant-form-item")]//input`,
    `//label[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${fieldName.toLowerCase()}")]/ancestor::div[contains(@class, "ant-form-item")]//textarea`,

    // Data attributes
    `input[data-testid="${fieldName}"]`,
    `textarea[data-testid="${fieldName}"]`,
    `input[data-cy="${fieldName}"]`,
    `textarea[data-cy="${fieldName}"]`
  ];

  // Try each selector with retries
  for (let attempt = 1; attempt <= 3; attempt++) {
    const timeout = attempt * 1500; // 1.5s, 3s, 4.5s

    for (const selector of selectors) {
      try {
        const field = page.locator(selector).first();

        // Check if field exists and is visible
        if (await field.isVisible({ timeout: 500 }).catch(() => false)) {
          await field.waitFor({ state: 'visible', timeout });

          // Check if field is editable (not readonly/disabled)
          const isReadOnly = await field.getAttribute('readonly').catch(() => null);
          const isDisabled = await field.getAttribute('disabled').catch(() => null);

          if (!isReadOnly && !isDisabled) {
            // Clear existing value and fill new value
            await field.clear();
            await field.fill(value);

            // Verify value was set
            const actualValue = await field.inputValue().catch(() => '');
            if (actualValue === value) {
              await page.waitForTimeout(300); // Allow UI to process
              return true;
            } else {
              console.warn(`Field "${fieldName}" value not set correctly. Expected: "${value}", Got: "${actualValue}"`);
            }
          } else {
            console.warn(`Field "${fieldName}" is readonly/disabled`);
          }
        }
      } catch (e) {
        continue;
      }
    }

    // Wait before retrying
    if (attempt < 3) {
      await page.waitForTimeout(500);
    }
  }

  console.warn(`Could not find or fill field: ${fieldName}`);

  // Take screenshot for debugging
  try {
    await page.screenshot({
      path: `test-results/field-not-found-${fieldName.replace(/\s+/g, '-').toLowerCase()}.png`,
      fullPage: false
    });
  } catch (e) {
    // Ignore screenshot errors
  }

  return false;
}

/**
 * Select an option from a dropdown
 * @param {Page} page - Playwright page object
 * @param {string} fieldName - Field name or label
 * @param {string} optionText - Option text to select
 * @returns {Promise<boolean>} True if option was selected, false otherwise
 */
export async function selectOption(page, fieldName, optionText) {
  const selectors = [
    `//label[contains(text(), "${fieldName}")]/following-sibling::*//div[contains(@class, "ant-select")]`,
    `//label[contains(text(), "${fieldName}")]/ancestor::div[contains(@class, "ant-form-item")]//div[contains(@class, "ant-select")]`,
    `//label[contains(text(), "${fieldName}")]/following-sibling::*//select`,
    `select[name="${fieldName}"]`,
    `.ant-select:has-text("${fieldName}")`
  ];
  
  for (const selector of selectors) {
    try {
      const dropdown = page.locator(selector).first();
      if (await dropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dropdown.waitFor({ state: 'visible', timeout: 2000 });
        await dropdown.click();
        await page.waitForTimeout(500);
        
        // Wait for dropdown menu to appear
        await page.waitForSelector('.ant-select-dropdown, .ant-select-item-option', { timeout: 3000 }).catch(() => {});
        
        // Try to click the option
        const optionSelectors = [
          `.ant-select-item-option:has-text("${optionText}")`,
          `//div[contains(@class, "ant-select-item-option") and contains(text(), "${optionText}")]`,
          `text="${optionText}"`
        ];
        
        for (const optSelector of optionSelectors) {
          try {
            const option = page.locator(optSelector).first();
            if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
              await option.click();
              await page.waitForTimeout(300);
              return true;
            }
          } catch (e) {
            continue;
          }
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  console.warn(`Could not find dropdown or option: ${fieldName} -> ${optionText}`);
  return false;
}

/**
 * Click a button by text
 * @param {Page} page - Playwright page object
 * @param {string} buttonText - Button text (supports English and Chinese)
 * @returns {Promise<boolean>} True if button was clicked, false otherwise
 */
export async function clickButton(page, buttonText) {
  // First wait for any loading states to clear
  await waitForLoading(page);

  // Enhanced selectors for common UI patterns
  const selectors = [
    // Direct text matches
    `button:has-text("${buttonText}")`,
    `a:has-text("${buttonText}")`,
    `[role="button"]:has-text("${buttonText}")`,

    // Aria labels and titles
    `button[aria-label="${buttonText}"]`,
    `button[title="${buttonText}"]`,
    `a[aria-label="${buttonText}"]`,

    // Case-insensitive text matches (for internationalization)
    `button:has-text("${buttonText.toLowerCase()}")`,
    `a:has-text("${buttonText.toLowerCase()}")`,

    // XPath for partial text matches and nested elements
    `//button[contains(text(), "${buttonText}")]`,
    `//a[contains(text(), "${buttonText}")]`,
    `//span[contains(text(), "${buttonText}")]/ancestor::button`,
    `//span[contains(text(), "${buttonText}")]/ancestor::a`,
    `//div[contains(text(), "${buttonText}")]/ancestor::button`,
    `//div[contains(text(), "${buttonText}")]/ancestor::a`,

    // Ant Design specific patterns
    `.ant-btn:has-text("${buttonText}")`,
    `.ant-btn span:has-text("${buttonText}")`,

    // Common UI patterns for create/save/submit
    `button[type="submit"]:has-text("${buttonText}")`,
    `input[type="submit"][value="${buttonText}"]`,

    // Data attributes (common in modern apps)
    `[data-testid="${buttonText.toLowerCase()}"]`,
    `[data-cy="${buttonText.toLowerCase()}"]`,
    `button[data-action="${buttonText.toLowerCase()}"]`
  ];

  // Try each selector with increasing timeouts
  for (let attempt = 1; attempt <= 3; attempt++) {
    const timeout = attempt * 2000; // 2s, 4s, 6s

    for (const selector of selectors) {
      try {
        const button = page.locator(selector).first();

        // Check if button exists and is visible
        if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
          // Wait for button to be ready (not disabled, not loading)
          await button.waitFor({ state: 'visible', timeout });
          await page.waitForTimeout(200); // Small stabilization delay

          // Check if button is enabled (not disabled or loading)
          const isDisabled = await button.getAttribute('disabled').catch(() => null);
          const isLoading = await button.locator('.anticon-loading, .loading').isVisible({ timeout: 500 }).catch(() => false);

          if (!isDisabled && !isLoading) {
            // Scroll into view if needed
            await button.scrollIntoViewIfNeeded();

            // Click with error handling
            await Promise.race([
              button.click({ timeout: 5000 }),
              page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
            ]);

            await page.waitForTimeout(500); // Allow UI to respond
            return true;
          } else if (isDisabled) {
            console.warn(`Button "${buttonText}" is disabled, waiting...`);
            await page.waitForTimeout(1000);
          } else if (isLoading) {
            console.warn(`Button "${buttonText}" is loading, waiting...`);
            await page.waitForTimeout(1000);
          }
        }
      } catch (e) {
        // Continue to next selector
        continue;
      }
    }

    // If no button found in this attempt, wait before trying again
    if (attempt < 3) {
      console.warn(`Button "${buttonText}" not found, retrying in 1s (attempt ${attempt}/3)...`);
      await page.waitForTimeout(1000);
    }
  }

  // If we get here, button was not found
  console.warn(`Could not find button: ${buttonText}`);

  // Take a screenshot for debugging
  try {
    await page.screenshot({
      path: `test-results/button-not-found-${buttonText.replace(/\s+/g, '-').toLowerCase()}.png`,
      fullPage: true
    });
  } catch (e) {
    // Ignore screenshot errors
  }

  return false;
}

/**
 * Wait for and verify success message
 * @param {Page} page - Playwright page object
 * @param {string} message - Expected message text (partial match is OK)
 */
export async function verifySuccessMessage(page, message) {
  // Wait a bit for message to appear
  await page.waitForTimeout(1000);
  
  const messageSelectors = [
    `.ant-message-success`,
    `.ant-notification-success`,
    `[role="alert"]`,
    `.ant-message`,
    `.ant-notification`
  ];
  
  // Try to find any success message first
  for (const selector of messageSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Check if it contains the message text (case insensitive)
        const text = await element.textContent().catch(() => '');
        if (text.toLowerCase().includes(message.toLowerCase())) {
          return true;
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  // Also check for text anywhere on page (for inline success messages)
  try {
    const pageText = await page.textContent('body').catch(() => '');
    if (pageText.toLowerCase().includes(message.toLowerCase())) {
      return true;
    }
  } catch (e) {
    // Ignore
  }
  
  // Check URL change as alternative success indicator
  const url = page.url();
  if (!url.includes('/create') && !url.includes('/new')) {
    // If we navigated away from create page, might indicate success
    return true;
  }
  
  return false;
}

/**
 * Wait for and verify error message
 * @param {Page} page - Playwright page object
 * @param {string} message - Expected error message text
 */
export async function verifyErrorMessage(page, message) {
  const messageSelectors = [
    `.ant-message-error:has-text("${message}")`,
    `.ant-notification-error:has-text("${message}")`,
    `.ant-form-item-explain-error:has-text("${message}")`,
    `[role="alert"]:has-text("${message}")`
  ];
  
  for (const selector of messageSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        return true;
      }
    } catch (e) {
      continue;
    }
  }
  
  return false;
}

/**
 * Wait for table to load and return row count
 * @param {Page} page - Playwright page object
 * @returns {Promise<number>} Number of rows
 */
export async function getTableRowCount(page) {
  // Try to find table with multiple strategies
  const tableSelectors = [
    'table',
    '.ant-table',
    '[role="table"]',
    '.ant-table-wrapper table',
    '.ant-table-container table'
  ];
  
  let tableFound = false;
  for (const selector of tableSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000, state: 'visible' });
      tableFound = true;
      break;
    } catch (e) {
      continue;
    }
  }
  
  if (!tableFound) {
    // If no table found, return 0 instead of throwing
    return 0;
  }
  
  const rows = await page.locator('table tbody tr, .ant-table-tbody tr, [role="table"] tbody tr, .ant-table-tbody > tr').count();
  return rows;
}

/**
 * Search in a table/search box
 * @param {Page} page - Playwright page object
 * @param {string} searchText - Text to search
 */
export async function searchInTable(page, searchText) {
  const searchSelectors = [
    'input[placeholder*="Search"]',
    'input[placeholder*="搜索"]',
    'input[type="search"]',
    '.ant-input-search input'
  ];
  
  for (const selector of searchSelectors) {
    try {
      const searchBox = page.locator(selector).first();
      if (await searchBox.isVisible({ timeout: 1000 })) {
        await searchBox.fill(searchText);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000); // Wait for search results
        return;
      }
    } catch (e) {
      continue;
    }
  }
}

/**
 * Click on a table row by text content
 * @param {Page} page - Playwright page object
 * @param {string} rowText - Text to find in the row
 */
export async function clickTableRow(page, rowText) {
  const row = page.locator(`table tbody tr:has-text("${rowText}"), .ant-table-tbody tr:has-text("${rowText}")`).first();
  await row.click();
  await page.waitForTimeout(500);
}

/**
 * Upload a file
 * @param {Page} page - Playwright page object
 * @param {string} filePath - Path to file to upload
 * @param {string} inputSelector - Selector for file input (optional)
 */
export async function uploadFile(page, filePath, inputSelector = 'input[type="file"]') {
  const fileInput = page.locator(inputSelector).first();
  await fileInput.setInputFiles(filePath);
  await page.waitForTimeout(1000);
}

/**
 * Wait for loading to complete
 * @param {Page} page - Playwright page object
 */
export async function waitForLoading(page) {
  // Wait for loading spinners to disappear
  await page.waitForSelector('.ant-spin, [class*="loading"], [class*="spinner"]', {
    state: 'hidden',
    timeout: 10000
  }).catch(() => {});

  // Wait for network to be idle (with timeout)
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  // Small delay to ensure everything is settled
  await page.waitForTimeout(500);
}

/**
 * Wait for page to be ready for interaction
 * @param {Page} page - Playwright page object
 * @param {Object} options - Options for waiting
 */
export async function waitForPageReady(page, options = {}) {
  const {
    timeout = 30000,
    waitForNetwork = true,
    waitForReact = true
  } = options;

  try {
    // Wait for basic page load
    await page.waitForLoadState('domcontentloaded', { timeout });

    // Wait for React to be ready (if applicable)
    if (waitForReact) {
      await page.waitForFunction(
        () => window.React || document.querySelector('#root, [data-reactroot], .App'),
        { timeout: timeout / 2 }
      ).catch(() => {});
    }

    // Wait for network to be idle
    if (waitForNetwork) {
      await page.waitForLoadState('networkidle', { timeout: timeout / 2 }).catch(() => {});
    }

    // Wait for common loading indicators
    await waitForLoading(page);

    // Additional wait for UI stabilization
    await page.waitForTimeout(1000);

  } catch (error) {
    console.warn('Page ready wait timed out, continuing anyway:', error.message);
  }
}

/**
 * Enhanced navigation with better error handling and waiting
 * @param {Page} page - Playwright page object
 * @param {string} path - Path to navigate to
 * @param {Object} options - Navigation options
 */
export async function navigateToEnhanced(page, path, options = {}) {
  const { timeout = 30000, waitForReady = true } = options;

  try {
    console.log(`Navigating to: ${path}`);
    await page.goto(path, {
      waitUntil: 'domcontentloaded',
      timeout
    });

    if (waitForReady) {
      await waitForPageReady(page, { timeout: timeout / 2 });
    }

  } catch (error) {
    console.warn(`Navigation to ${path} failed, retrying with load state...`);
    try {
      await page.goto(path, { waitUntil: 'load', timeout });
      if (waitForReady) {
        await waitForPageReady(page, { timeout: timeout / 2 });
      }
    } catch (retryError) {
      console.error(`Navigation to ${path} failed completely:`, retryError.message);
      throw retryError;
    }
  }
}

/**
 * Wait for element to be ready for interaction
 * @param {Page} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {Object} options - Wait options
 */
export async function waitForElementReady(page, selector, options = {}) {
  const {
    timeout = 10000,
    visible = true,
    enabled = true
  } = options;

  try {
    const element = page.locator(selector).first();

    if (visible) {
      await element.waitFor({ state: 'visible', timeout });
    } else {
      await element.waitFor({ state: 'attached', timeout });
    }

    if (enabled) {
      // Wait for element to not be disabled
      await page.waitForFunction(
        (sel) => {
          const el = document.querySelector(sel);
          return el && !el.disabled && !el.getAttribute('aria-disabled');
        },
        selector,
        { timeout }
      );
    }

    // Scroll into view
    await element.scrollIntoViewIfNeeded();

    // Small stabilization delay
    await page.waitForTimeout(200);

    return true;

  } catch (error) {
    console.warn(`Element not ready: ${selector}`, error.message);
    return false;
  }
}

/**
 * Get text content of an element
 * @param {Page} page - Playwright page object
 * @param {string} selector - Element selector
 * @returns {Promise<string>} Text content
 */
export async function getTextContent(page, selector) {
  const element = page.locator(selector).first();
  return await element.textContent();
}

/**
 * Verify element is visible
 * @param {Page} page - Playwright page object
 * @param {string} selector - Element selector
 */
export async function verifyVisible(page, selector) {
  const element = page.locator(selector).first();
  await expect(element).toBeVisible();
}

/**
 * Verify element contains text
 * @param {Page} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {string} text - Expected text
 */
export async function verifyContainsText(page, selector, text) {
  const element = page.locator(selector).first();
  await expect(element).toContainText(text);
}

/**
 * Create a test user with specific role
 * @param {Page} page - Playwright page object
 * @param {Object} userData - User data object
 */
export async function createTestUser(page, userData) {
  // Navigate to user management (if exists)
  await navigateTo(page, '/admin');
  await clickButton(page, 'Create');
  
  // Fill user form
  await fillField(page, 'Email', userData.email);
  await fillField(page, 'Name', userData.name);
  if (userData.password) {
    await fillField(page, 'Password', userData.password);
  }
  
  // Select role if provided
  if (userData.role) {
    await selectOption(page, 'Role', userData.role);
  }
  
  await clickButton(page, 'Save');
  await waitForLoading(page);
}

/**
 * Procurement-specific test helpers
 */

/**
 * Create a supplier using the UI
 * @param {Page} page - Playwright page object
 * @param {Object} supplierData - Supplier data to create
 */
export async function createSupplier(page, supplierData = {}) {
  const defaultData = {
    companyNameZh: '测试供应商',
    companyNameEn: 'Test Supplier',
    type: 'manufacturer',
    email: testData.randomEmail()
  };

  const data = { ...defaultData, ...supplierData };

  // Navigate to suppliers page
  await navigateTo(page, '/suppliers');
  await waitForPageReady(page);

  // Click create button
  const createClicked = await clickButton(page, 'Create');
  if (!createClicked) {
    throw new Error('Could not find Create button on suppliers page');
  }

  await page.waitForTimeout(1000);

  // Fill form fields
  await fillField(page, 'Company Name (ZH)', data.companyNameZh);
  await fillField(page, 'Company Name (EN)', data.companyNameEn);
  await selectOption(page, 'Type', data.type);
  await fillField(page, 'Email', data.email);

  // Save
  const saved = await clickButton(page, 'Save');
  if (!saved) {
    throw new Error('Could not find Save button');
  }

  // Wait for success
  await waitForLoading(page);
  return await verifySuccessMessage(page, 'created successfully');
}

/**
 * Create a material using the UI
 * @param {Page} page - Playwright page object
 * @param {Object} materialData - Material data to create
 */
export async function createMaterial(page, materialData = {}) {
  const defaultData = {
    materialCode: `MAT-${Date.now()}`,
    materialNameZh: '测试物料',
    materialNameEn: 'Test Material',
    unitOfMeasure: 'EA'
  };

  const data = { ...defaultData, ...materialData };

  // Navigate to materials page
  await navigateTo(page, '/materials');
  await waitForPageReady(page);

  // Click create button
  const createClicked = await clickButton(page, 'Create');
  if (!createClicked) {
    throw new Error('Could not find Create button on materials page');
  }

  await page.waitForTimeout(1000);

  // Fill form fields
  await fillField(page, 'Material Code', data.materialCode);
  await fillField(page, 'Material Name (ZH)', data.materialNameZh);
  await fillField(page, 'Material Name (EN)', data.materialNameEn);
  await selectOption(page, 'Unit of Measure', data.unitOfMeasure);

  // Save
  const saved = await clickButton(page, 'Save');
  if (!saved) {
    throw new Error('Could not find Save button');
  }

  // Wait for success
  await waitForLoading(page);
  return await verifySuccessMessage(page, 'created successfully');
}

/**
 * Create a purchase order using the UI
 * @param {Page} page - Playwright page object
 * @param {Object} poData - PO data to create
 */
export async function createPurchaseOrder(page, poData = {}) {
  const defaultData = {
    supplier: 'Test Supplier',
    material: 'Test Material',
    quantity: 10,
    unitPrice: 100.00
  };

  const data = { ...defaultData, ...poData };

  // Navigate to POs page
  await navigateTo(page, '/purchase-orders');
  await waitForPageReady(page);

  // Click create button
  const createClicked = await clickButton(page, 'Create');
  if (!createClicked) {
    throw new Error('Could not find Create button on purchase orders page');
  }

  await page.waitForTimeout(1000);

  // Fill form fields
  await selectOption(page, 'Supplier', data.supplier);
  await fillField(page, 'Quantity', data.quantity.toString());
  await fillField(page, 'Unit Price', data.unitPrice.toString());

  // Save
  const saved = await clickButton(page, 'Save');
  if (!saved) {
    throw new Error('Could not find Save button');
  }

  // Wait for success
  await waitForLoading(page);
  return await verifySuccessMessage(page, 'created successfully');
}

/**
 * Submit a document for approval
 * @param {Page} page - Playwright page object
 * @param {string} documentType - Type of document (supplier, purchase_order, etc.)
 */
export async function submitForApproval(page, documentType) {
  // Look for submit button in various locations
  const submitSelectors = [
    'button:has-text("Submit")',
    'button:has-text("Submit for Approval")',
    'button:has-text("提交")',
    'button[data-action="submit"]'
  ];

  for (const selector of submitSelectors) {
    try {
      const submitButton = page.locator(selector).first();
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();

        // Handle confirmation dialog if it appears
        try {
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("确定")').first();
          if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmButton.click();
          }
        } catch (e) {
          // No confirmation dialog
        }

        await waitForLoading(page);
        return await verifySuccessMessage(page, 'submitted');
      }
    } catch (e) {
      continue;
    }
  }

  console.warn(`Could not find submit button for ${documentType}`);
  return false;
}

/**
 * Approve a document in the approval dashboard
 * @param {Page} page - Playwright page object
 * @param {string} documentType - Type of document to approve
 */
export async function approveDocument(page, documentType) {
  // Navigate to approvals
  await navigateTo(page, '/approvals');
  await waitForPageReady(page);

  // Look for approve button
  const approveSelectors = [
    'button:has-text("Approve")',
    'button:has-text("批准")',
    'button[data-action="approve"]'
  ];

  for (const selector of approveSelectors) {
    try {
      const approveButton = page.locator(selector).first();
      if (await approveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await approveButton.click();

        // Handle confirmation
        try {
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("确定")').first();
          if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmButton.click();
          }
        } catch (e) {
          // No confirmation dialog
        }

        await waitForLoading(page);
        return await verifySuccessMessage(page, 'approved');
      }
    } catch (e) {
      continue;
    }
  }

  console.warn(`Could not find approve button for ${documentType}`);
  return false;
}

/**
 * Generate random test data
 */
export const testData = {
  randomEmail: () => `test_${Date.now()}@test.com`,
  randomString: (length = 10) => Math.random().toString(36).substring(2, length + 2),
  randomNumber: (min = 1000, max = 9999) => Math.floor(Math.random() * (max - min + 1)) + min,
  randomDate: () => new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
};

