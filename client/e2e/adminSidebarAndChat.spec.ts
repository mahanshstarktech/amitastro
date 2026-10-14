import { test, expect } from '@playwright/test';

test.describe('E2E: Admin Sidebar Collapse, Logo Hover, Profile Alterations & Customer Chat', () => {
  test('validates sidebar collapse toggle, logo hover interchange, and advanced profile modal', async ({ page }) => {
    // 1. Log in as admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const signInBtn = page.getByRole('button', { name: /Sign In|Login/i }).first();
    await signInBtn.click();

    await page.fill('input[type="email"]', 'admin@amitastro.com');
    await page.fill('input[type="password"]', 'AmitAstro@2026');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Astrologer Access Required')).not.toBeVisible({ timeout: 15000 });

    const rail = page.locator('.portal-app-rail');
    await expect(rail).toBeVisible();

    // Verify initial expanded rail width (~240px)
    const expandedBox = await rail.boundingBox();
    expect(expandedBox?.width).toBeCloseTo(240, -1);

    // Verify original logo mark and Amit Astro text
    await expect(rail.locator('img[alt="Amit Astro Logo"]')).toBeVisible();
    await expect(rail.getByText('Amit Astro')).toBeVisible();

    // Verify updated tabs
    await expect(rail.getByRole('button', { name: /Chats/i })).toBeVisible();
    await expect(rail.getByRole('button', { name: /Clients & Kundli/i })).toBeVisible();
    await expect(rail.getByRole('button', { name: /Articles/i })).toBeVisible();

    // 2. Click collapse sidebar button
    const collapseBtn = rail.getByRole('button', { name: 'Collapse sidebar' });
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();

    // Wait for smooth transition
    await page.waitForTimeout(400);

    // Verify collapsed width (~68px)
    const collapsedBox = await rail.boundingBox();
    expect(collapsedBox?.width).toBeCloseTo(68, -1);

    // In collapsed state, top button has hover interchange
    const railToggle = rail.locator('.sidebar-rail-hover-toggle');
    await expect(railToggle).toBeVisible();

    // Click to expand back
    await railToggle.click();
    await page.waitForTimeout(400);

    const reExpandedBox = await rail.boundingBox();
    expect(reExpandedBox?.width).toBeCloseTo(240, -1);

    // 3. Test Profile ID Card & 3-Dots Menu
    const profileOptionsBtn = rail.getByRole('button', { name: /Profile options/i });
    await expect(profileOptionsBtn).toBeVisible();
    await profileOptionsBtn.click();

    const profileSettingsBtn = page.getByRole('button', { name: /Profile Settings/i });
    await expect(profileSettingsBtn).toBeVisible();
    await profileSettingsBtn.click();

    // 4. Verify Advanced Profile Alteration Modal
    await expect(page.locator('text=Astrologer Profile & Practice')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Identity & Bio' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rates & Timings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Security & Password' })).toBeVisible();

    // Switch to Rates & Timings tab
    await page.getByRole('button', { name: 'Rates & Timings' }).click();
    await expect(page.locator('text=Standard 30-Min Consultation Fee')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('text=Astrologer Profile & Practice')).not.toBeVisible();
  });

  test('validates customer chat full viewport isolation and no marketing footer leak', async ({ page }) => {
    // 1. Visit customer portal chat directly
    await page.goto('/app#chat');
    await page.waitForLoadState('networkidle');

    // 2. Footer should not be rendered on /app#chat
    const chronicle = page.locator('text=The Amit Astro Chronicle');
    await expect(chronicle).not.toBeVisible();

    const aboutFooter = page.locator('text=About Amit Astro');
    await expect(aboutFooter).not.toBeVisible();
  });
});
