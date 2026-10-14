import { test, expect } from '@playwright/test';

test.describe('E2E: Consultation Booking & Timezone-Aware Scheduling Flow', () => {
  test('opens booking modal and renders timezone-aware slot selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on Book Consultation CTA in header
    const bookBtn = page.getByRole('button', { name: 'Book Consultation', exact: true }).first();
    await bookBtn.click();

    // Verify booking modal header appears
    await expect(page.locator('text=Reserve Your Session with Amit')).toBeVisible();

    // Verify timezone conversion notice is shown
    await expect(page.locator('text=Detected timezone:')).toBeVisible();

    // Verify close button dismisses modal
    const closeBtn = page.locator('button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await expect(page.locator('text=Reserve Your Session with Amit')).not.toBeVisible();
  });
});
