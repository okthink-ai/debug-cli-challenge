import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
try {
  await page.goto('http://localhost:8087');
  await page.getByTestId('row-task-001').waitFor();
  await page.getByTestId('draft').fill('Web smoke check');
  await page.getByTestId('add').click();
  await page.getByTestId('status').filter({ hasText: 'Added to your list' }).waitFor();
  assert.ok(await page.getByText('Web smoke check', { exact: true }).count());
  console.log('PASS: web loads seeded todos and creates a task through the real UI.');
} finally { await browser.close(); }
