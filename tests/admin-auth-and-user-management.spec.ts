import { expect, type Locator, type Page, type TestInfo, test } from '@playwright/test';

type UserData = {
  name: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'otto';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Otto@2024!';
const INVALID_EMAIL = 'otto';
const INVALID_PASSWORD = '12345';

function uniqueEmail(prefix = 'pw-admin'): string {
  return `${prefix}-${Date.now()}@example.com`;
}

async function firstVisible(locators: Locator[]): Promise<Locator> {
  for (const locator of locators) {
    const count = await locator.count();
    if (count > 0 && (await locator.first().isVisible().catch(() => false))) {
      return locator.first();
    }
  }

  throw new Error('No visible locator matched the provided candidates.');
}

async function attachSuccessScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const screenshot = await page.screenshot({ fullPage: true });
  await testInfo.attach(name, {
    body: screenshot,
    contentType: 'image/png',
  });
}

async function openLogin(page: Page): Promise<void> {
  await page.goto('/login/');
  await expect(page).toHaveURL(/login/i);
  await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
}

async function login(page: Page, email: string, password: string): Promise<void> {
  await openLogin(page);

  const usernameInput = await firstVisible([
    page.getByRole('textbox', { name: /username|email/i }),
    page.getByLabel(/username|email/i),
    page.getByPlaceholder(/username|email/i),
  ]);

  const passwordInput = await firstVisible([
    page.getByLabel(/password/i),
    page.getByPlaceholder(/password/i),
    page.locator('input[type="password"]'),
  ]);

  await usernameInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /login/i }).click();
}

async function assertLoggedIn(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/login/i);
  await expect(page).toHaveURL(/portal-otto#\/?$/i);

  await expect(
    await firstVisible([
      page.getByText(/^welcome$/i),
      page.getByRole('main').getByText(/welcome/i),
      page.getByText(new RegExp(ADMIN_EMAIL, 'i')),
    ]),
  ).toBeVisible();

  await expect(
    await firstVisible([
      page.getByRole('menuitem', { name: /user management/i }),
      page.getByRole('link', { name: /user management/i }),
      page.getByText(/user management/i),
    ]),
  ).toBeVisible();
}

async function gotoUserManagement(page: Page): Promise<void> {
  const userManagementTrigger = await firstVisible([
    page.getByRole('menuitem', { name: /user management/i }),
    page.getByRole('link', { name: /user management/i }),
    page.getByText(/user management/i),
  ]);

  await userManagementTrigger.click();

  // TODO: tighten this assertion once the exact heading or URL pattern for User Management is confirmed.
  await expect(
    await firstVisible([
      page.getByRole('heading', { name: /user management/i }),
      page.getByText(/user management/i),
      page.locator('main'),
    ]),
  ).toBeVisible();
}

async function addUser(page: Page, userData: UserData): Promise<void> {
  const addUserButton = await firstVisible([
    page.getByRole('button', { name: /add user/i }),
    page.getByRole('link', { name: /add user/i }),
    page.getByText(/add user/i),
  ]);

  await addUserButton.click();

  // TODO: replace fallback locators with exact accessible names from the real add-user form once confirmed.
  await (await firstVisible([
    page.getByLabel(/^name$/i),
    page.getByPlaceholder(/name/i),
    page.getByRole('textbox', { name: /^name$/i }),
  ])).fill(userData.name);

  await (await firstVisible([
    page.getByLabel(/^email$/i),
    page.getByPlaceholder(/email/i),
    page.getByRole('textbox', { name: /^email$/i }),
  ])).fill(userData.email);

  const roleField = await firstVisible([
    page.getByLabel(/role/i),
    page.getByRole('combobox', { name: /role/i }),
    page.getByPlaceholder(/role/i),
  ]);

  const roleTag = await roleField.evaluate((node) => node.tagName.toLowerCase());
  if (roleTag === 'select') {
    await roleField.selectOption({ label: userData.role }).catch(async () => {
      await roleField.selectOption({ value: userData.role });
    });
  } else {
    await roleField.click();
    await roleField.fill(userData.role);
    // TODO: if the role control is a custom dropdown, replace this with the app's exact option locator.
    const roleOption = await firstVisible([
      page.getByRole('option', { name: new RegExp(userData.role, 'i') }),
      page.getByText(new RegExp(`^${userData.role}$`, 'i')),
    ]);
    await roleOption.click();
  }

  const passwordField = await firstVisible([
    page.getByLabel(/^password$/i),
    page.getByPlaceholder(/^password$/i),
    page.locator('input[type="password"]').nth(0),
  ]);

  const confirmPasswordField = await firstVisible([
    page.getByLabel(/confirm password/i),
    page.getByPlaceholder(/confirm password/i),
    page.locator('input[type="password"]').nth(1),
  ]);

  await passwordField.fill(userData.password);
  await confirmPasswordField.fill(userData.confirmPassword);

  const submitButton = await firstVisible([
    page.getByRole('button', { name: /submit|save|create/i }),
    page.getByText(/submit|save|create/i),
  ]);

  await submitButton.click();

  // TODO: replace with the real toast/status locator and exact copy from the app.
  await expect(
    await firstVisible([
      page.getByRole('alert'),
      page.getByText(/success|berhasil|created/i),
    ]),
  ).toBeVisible();

  // TODO: replace with the exact table/grid locator once the user list structure is confirmed.
  await expect(
    await firstVisible([
      page.getByRole('table').getByText(userData.email),
      page.getByRole('grid').getByText(userData.email),
      page.getByText(userData.email),
    ]),
  ).toBeVisible();
}

test.describe('Admin web app authentication and user management', () => {
  test('negative login with invalid credentials', async ({ page }) => {
    await openLogin(page);

    await (await firstVisible([
      page.getByRole('textbox', { name: /username|email/i }),
      page.getByLabel(/username|email/i),
      page.getByPlaceholder(/username|email/i),
    ])).fill(INVALID_EMAIL);

    await (await firstVisible([
      page.getByLabel(/password/i),
      page.getByPlaceholder(/password/i),
      page.locator('input[type="password"]'),
    ])).fill(INVALID_PASSWORD);

    await page.getByRole('button', { name: /login/i }).click();

    // TODO: replace with the exact invalid-login feedback copy from the real app.
    await expect(
      await firstVisible([
        page.getByRole('alert'),
        page.getByText(/invalid|incorrect|wrong|failed|error/i),
      ]),
    ).toBeVisible();

    await expect(page).toHaveURL(/login/i);
  });

  test('positive login', async ({ page }, testInfo) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await assertLoggedIn(page);
    await attachSuccessScreenshot(page, testInfo, 'positive-login-success');
  });

  test('login -> go to user management -> add user', async ({ page }, testInfo) => {
    const userData: UserData = {
      name: 'Playwright Admin User',
      email: uniqueEmail(),
      role: 'Admin',
      password: 'Otto@2024!',
      confirmPassword: 'Otto@2024!',
    };

    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await assertLoggedIn(page);
    await gotoUserManagement(page);
    await addUser(page, userData);
    await attachSuccessScreenshot(page, testInfo, 'user-management-add-user-success');
  });
});
