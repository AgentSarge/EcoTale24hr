import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show login form by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should allow user to reset password', async ({ page }) => {
    await page.getByText('Forgot password?').click();
    await expect(page).toHaveURL('/reset-password');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(page.getByText('Check your email')).toBeVisible();
  });

  test('should allow user to sign up', async ({ page }) => {
    await page.getByText('Create an account').click();
    await expect(page).toHaveURL('/signup');
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL('/verify-email');
    await expect(page.getByText('Verify your email')).toBeVisible();
  });
}); 