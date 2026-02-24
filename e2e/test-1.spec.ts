import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test ('should display key elements on homepage', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(1000);
    //kainos logo
    await expect(page.getByRole('link', { name: 'Kainos Logo' })).toBeVisible();
    await page.waitForTimeout(1000);
    //login button
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await page.waitForTimeout(1000);
    //view all roles
    await expect(page.getByRole('link', { name: 'View All Roles' })).toBeVisible();
  });

  test('should navigate to view all roles page', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(1000);
    await page.getByRole('link', { name: 'View All Roles' }).click();
    await expect(page.getByRole('heading', { name: 'Current Vacancies' })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(1000);
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page.getByRole('tab', { name: 'Log in' })).toBeVisible();
  });

  test('should navigate to role details page', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email:' }).click();
    await page.getByRole('textbox', { name: 'Email:' }).fill('david@test.com');
    await page.getByRole('textbox', { name: 'Email:' }).press('Tab');
    await page.getByRole('textbox', { name: 'Password:' }).press('CapsLock');
    await page.getByRole('textbox', { name: 'Password:' }).fill('Password123!');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByRole('link', { name: 'View All Roles' }).click();
    await page.getByRole('row', { name: 'Test Engineer Poland Testing' }).getByRole('link').click();
  });

});