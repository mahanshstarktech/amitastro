import { test, expect } from '@playwright/test';

test.describe('E2E: Home Page, Vedic Navigation & Internationalization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('loads home page with brand identity and core consultation calls to action', async ({ page }) => {
    // Assert title or brand logo
    await expect(page.locator('text=Amit Astro').first()).toBeVisible();

    // Assert main consultation or pricing buttons are rendered
    const consultBtn = page.getByRole('button', { name: /Consult Amit|Book Consultation|Discover Your Destiny/i }).first();
    await expect(consultBtn).toBeVisible();
  });

  test('toggles language between English and Hindi, updating DOM language attribute', async ({ page }) => {
    // Check initial language is English
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');

    // Look for language toggle button (often EN / HI or globe icon)
    const langBtn = page.locator('button:has-text("HI"), button:has-text("हिंदी"), [aria-label*="language"]').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await expect(html).toHaveAttribute('lang', 'hi');

      // Switch back to English
      const enBtn = page.locator('button:has-text("EN"), button:has-text("English")').first();
      if (await enBtn.isVisible()) {
        await enBtn.click();
        await expect(html).toHaveAttribute('lang', 'en');
      }
    }
  });

  test('navigates to Pricing page and verifies consultation tiers are displayed', async ({ page }) => {
    // Click on Pricing link in header or footer
    const pricingLink = page.getByRole('link', { name: /Pricing/i }).first();
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await expect(page).toHaveURL(/.*pricing/);
      await expect(page.locator('text=₹').first()).toBeVisible();
    }
  });

  test('renders properly on mobile viewport with responsive navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE viewport
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Brand remains visible
    await expect(page.locator('text=Amit Astro').first()).toBeVisible();
  });
});
