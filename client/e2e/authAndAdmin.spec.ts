import { test, expect } from '@playwright/test';

test.describe('E2E: Authentication Gate & Admin Portal Operations', () => {
  test('protects /admin route for unauthenticated visitors and prompts for sign-in', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should display Astrologer Access Required gate
    await expect(page.locator('text=Astrologer Access Required')).toBeVisible();

    // Clicking sign in triggers the AuthModal
    const signInBtn = page.getByRole('button', { name: /Sign In|Login/i }).first();
    await signInBtn.click();

    await expect(page.locator('text=Sign In to Amit Astro')).toBeVisible();
  });

  test('completes admin login and mounts the Admin Portal with operational tabs', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const signInBtn = page.getByRole('button', { name: /Sign In|Login/i }).first();
    await signInBtn.click();

    // Fill seeded admin credentials
    await page.fill('input[type="email"]', 'admin@amitastro.com');
    await page.fill('input[type="password"]', 'AmitAstro@2026');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for auth to complete and portal to load
    await expect(page.locator('text=Astrologer Access Required')).not.toBeVisible({ timeout: 15000 });

    // Verify Admin Portal headers and operational controls
    await expect(page.locator('.portal-app-rail').getByRole('button', { name: /Dashboard/i })).toBeVisible();
    await expect(page.locator('.portal-app-rail').getByRole('button', { name: /Chats/i })).toBeVisible();
    await expect(page.locator('.portal-app-rail').getByRole('button', { name: /Clients & Kundli/i })).toBeVisible();
    await expect(page.locator('.portal-app-rail').getByRole('button', { name: /Articles/i })).toBeVisible();

    // Verify Profile 3-dots options menu
    const profileOptionsBtn = page.getByRole('button', { name: /Profile options/i });
    await expect(profileOptionsBtn).toBeVisible();
    await profileOptionsBtn.click();
    await expect(page.getByRole('button', { name: /Profile Settings/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /View Public Site/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Privacy & Legal/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign Out/i })).toBeVisible();
  });
});
