/**
 * Script to capture screenshots for user manual
 * Run this script to generate screenshots for all use cases
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOT_DIR = path.join(__dirname, '../../../doc/screenshots');
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

async function captureScreenshots() {
  // Ensure screenshot directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Login
    console.log('Logging in...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.fill('input[name="email"]', 'admin@admin.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|home|$)/, { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Capture screenshots for each use case
    const screenshots = [
      { name: '01-supplier-list', url: '/suppliers', wait: 2000 },
      { name: '02-create-supplier-button', url: '/suppliers', action: async () => {
        const button = page.locator('button:has-text("Add new supplier"), button:has-text("Create")').first();
        if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
          await button.scrollIntoViewIfNeeded();
        }
      }},
      { name: '03-supplier-form', url: '/suppliers', action: async () => {
        const button = page.locator('button:has-text("Add new supplier"), button:has-text("Create")').first();
        if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
          await button.click();
          await page.waitForTimeout(1000);
        }
      }},
      // Add more screenshot captures as needed
    ];

    for (const screenshot of screenshots) {
      try {
        console.log(`Capturing ${screenshot.name}...`);
        
        if (screenshot.url) {
          await page.goto(`${BASE_URL}${screenshot.url}`);
          await page.waitForTimeout(screenshot.wait || 2000);
        }
        
        if (screenshot.action) {
          await screenshot.action();
          await page.waitForTimeout(1000);
        }
        
        await page.screenshot({ 
          path: path.join(SCREENSHOT_DIR, `${screenshot.name}.png`),
          fullPage: true 
        });
        
        console.log(`✓ Captured ${screenshot.name}`);
      } catch (error) {
        console.error(`✗ Failed to capture ${screenshot.name}:`, error.message);
      }
    }

    console.log('\nScreenshot capture complete!');
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  captureScreenshots().catch(console.error);
}

export { captureScreenshots };
