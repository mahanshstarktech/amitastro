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

  test('validates Customer Portal UI layout, collapsible rail, and profile ID card matching Admin Portal', async ({ page }) => {
    // 1. Visit /app and log in
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const signInBtn = page.getByRole('button', { name: /Sign In to Account|Sign In|Login/i }).first();
    await signInBtn.click();
    await page.fill('input[type="email"]', 'priya.sharma@example.com');
    await page.fill('input[type="password"]', 'Customer@123');
    await page.click('button[type="submit"]');

    const rail = page.locator('.portal-app-rail');
    await expect(rail).toBeVisible({ timeout: 15000 });

    // Verify initial expanded rail width (~240px)
    const expandedBox = await rail.boundingBox();
    expect(expandedBox?.width).toBeCloseTo(240, -1);

    // Verify original logo mark and Amit Astro branding
    await expect(rail.locator('img[alt="Amit Astro Logo"]')).toBeVisible();
    await expect(rail.getByText('Amit Astro')).toBeVisible();

    // Verify customer operational tabs
    await expect(rail.getByRole('button', { name: /Overview/i })).toBeVisible();
    await expect(rail.getByRole('button', { name: /Consultation Chat/i })).toBeVisible();
    await expect(rail.getByRole('button', { name: /Birth Profiles/i })).toBeVisible();
    await expect(rail.getByRole('button', { name: /Family 360 Plan/i })).toBeVisible();

    // 2. Test smooth rail collapse (240px -> 68px)
    const collapseBtn = rail.getByRole('button', { name: 'Collapse sidebar' });
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();
    await page.waitForTimeout(400);

    const collapsedBox = await rail.boundingBox();
    expect(collapsedBox?.width).toBeCloseTo(68, -1);

    // Verify hover interchange button appears
    const railToggle = rail.locator('.sidebar-rail-hover-toggle');
    await expect(railToggle).toBeVisible();

    // Expand back
    await railToggle.click();
    await page.waitForTimeout(400);

    const reExpandedBox = await rail.boundingBox();
    expect(reExpandedBox?.width).toBeCloseTo(240, -1);

    // 3. Verify profile options menu
    const profileOptionsBtn = rail.getByRole('button', { name: /Profile options/i });
    await expect(profileOptionsBtn).toBeVisible();
    await profileOptionsBtn.click();
    await expect(page.getByRole('button', { name: /View Public (Site|Website)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Privacy & Terms/i })).toBeVisible();
  });

  test('validates Mobile WhatsApp fixed elements UI: no Connected indicator, bottom nav rules, and composer pinning', async ({ page }) => {
    // Set mobile viewport (iPhone dimensions 375x812)
    await page.setViewportSize({ width: 375, height: 812 });

    // --- Part A: Customer Portal Mobile Chat ---
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const signInBtn = page.getByRole('button', { name: /Sign In to Account|Sign In|Login/i }).first();
    await signInBtn.click();
    await page.fill('input[type="email"]', 'priya.sharma@example.com');
    await page.fill('input[type="password"]', 'Customer@123');
    await page.click('button[type="submit"]');

    // Switch to Chat tab
    await page.goto('/app#chat');
    await page.waitForTimeout(800);

    // 1. Verify bottom nav is VISIBLE for customer (customer only has 1 chat)
    const customerBottomNav = page.locator('.apple-bottom-nav');
    await expect(customerBottomNav).toBeVisible();

    // 2. Verify no "Connected" indicator anywhere in chat
    const connectedText = page.locator('text=• Connected');
    await expect(connectedText).not.toBeVisible();
    const liveSubtext = page.locator('text=Consultation Desk · Messages sent here appear live to customer');
    await expect(liveSubtext).not.toBeVisible();

    // 3. Verify composer is pinned at the bottom and above the bottom nav without overlapping
    const customerComposer = page.locator('.hybrid-chat-composer').first();
    await expect(customerComposer).toBeVisible();
    const composerBox = await customerComposer.boundingBox();
    const navBox = await customerBottomNav.boundingBox();

    expect(composerBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    if (composerBox && navBox) {
      // Bottom of composer should meet top of bottom nav (within 5px tolerance)
      expect(composerBox.y + composerBox.height).toBeLessThanOrEqual(navBox.y + 6);
      expect(composerBox.y).toBeGreaterThan(400); // Definitely pinned near bottom, not floating at the top/middle
    }

    // 4. Verify Customer Chat Header is de-cluttered (no verified badge, no mute volume icon)
    await expect(page.getByText('Verified', { exact: true })).not.toBeVisible();
    await expect(page.locator('button[title*="Chime sound"]').or(page.locator('button[title*="Mute send chime"]'))).not.toBeVisible();

    // 5. Verify Vedic Quick Inquiry Dropdown (single message preview, click reveals options)
    const promptTrigger = page.locator('.quick-prompt-dropdown-trigger');
    await expect(promptTrigger).toBeVisible();
    await promptTrigger.click();

    const promptOption = page.locator('.prompt-dropdown-option').first();
    await expect(promptOption).toBeVisible();
    await promptOption.click();
    await expect(page.locator('.prompt-dropdown-option')).not.toBeVisible();

    // --- Part B: Admin Portal Mobile Chat Thread ---
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const adminSignInBtn = page.getByRole('button', { name: /Sign In|Login/i }).first();
    await adminSignInBtn.click();
    await page.fill('input[type="email"]', 'admin@amitastro.com');
    await page.fill('input[type="password"]', 'AmitAstro@2026');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Astrologer Access Required')).not.toBeVisible({ timeout: 15000 });

    // Switch to Chats tab
    await page.goto('/admin#chat');
    await page.waitForTimeout(600);

    // Click first conversation to enter thread view
    const firstConv = page.locator('.hybrid-chat-list-item').first();
    if (await firstConv.isVisible()) {
      await firstConv.click();
      await page.waitForTimeout(400);

      // In admin thread view:
      // 1. WhatsApp style back button is visible, but the word "Chats" is REMOVED
      const backBtn = page.locator('.mobile-back-btn');
      await expect(backBtn).toBeVisible();
      await expect(backBtn.getByText('Chats')).not.toBeVisible();

      // 2. Bottom nav MUST disappear completely (WhatsApp-style full chat window)
      const adminBottomNav = page.locator('.apple-bottom-nav');
      await expect(adminBottomNav).not.toBeVisible();

      // 3. Verify no "Connected" indicator
      await expect(page.locator('text=• Connected')).not.toBeVisible();
      await expect(page.locator('text=Consultation Desk · Messages sent here appear live to customer')).not.toBeVisible();

      // 4. Verify admin composer is pinned at bottom of viewport
      const adminComposer = page.locator('.hybrid-chat-composer').first();
      await expect(adminComposer).toBeVisible();
      const adminComposerBox = await adminComposer.boundingBox();
      if (adminComposerBox) {
        expect(adminComposerBox.y + adminComposerBox.height).toBeCloseTo(812, -1);
      }

      // 5. Clicking back button restores list view and reveals bottom nav
      await backBtn.click();
      await page.waitForTimeout(400);
      await expect(adminBottomNav).toBeVisible();
    }
  });
});

