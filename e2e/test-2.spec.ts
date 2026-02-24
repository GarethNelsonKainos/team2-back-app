import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3001/home');
  await page.getByRole('link', { name: 'View All Roles' }).click();
  await page.getByRole('row', { name: 'Test Engineer Poland Testing' }).getByRole('link').click();
  await page.getByRole('link', { name: 'log in' }).click();
  await page.getByRole('textbox', { name: 'Email:' }).fill('lauren@test.com');
  await page.getByRole('textbox', { name: 'Email:' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password:' }).fill('Password123!');
  await page.getByRole('button', { name: 'Submit' }).click();
});