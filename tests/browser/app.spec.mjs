import { test, expect } from '@playwright/test';

const api = 'http://127.0.0.1:4311';
test.beforeEach(async ({ page, request }) => {
  const reset = await request.post(`${api}/__demo/reset`, {
    headers: { 'X-Demo-Control': '1' },
    data: { count: 120 },
  });
  expect(reset.ok()).toBeTruthy();
  await page.goto('/');
  await expect(page.getByTestId('row-task-001')).toBeVisible();
});

test('create a task through the UI and find it after reload', async ({ page }) => {
  await page.getByTestId('draft').fill('Rehearse the demo');
  await page.getByTestId('add').click();
  await expect(page.getByTestId('status')).toHaveText('Added to your list');
  await page.reload();
  await expect(page.getByText('Rehearse the demo', { exact: true })).toBeVisible();
});

test('render highlighting is visible, controllable, and does not change tasks', async ({
  page,
}) => {
  const toggle = page.getByRole('switch', { name: 'Highlight renders' });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(page.getByText('Highlight renders: off', { exact: true })).toBeVisible();
  await page.getByTestId('draft').fill('A draft');
  await expect(page.getByTestId('row-task-001')).toHaveCSS(
    'border-top-color',
    'rgb(233, 232, 228)',
  );
  await expect(page.getByTestId('toggle-task-001')).toHaveAttribute('aria-checked', 'false');
});

// These assert the intended product behavior, so the shipped challenge fails them.
test('@acceptance completion survives refresh and a new page load', async ({ page }) => {
  await page.getByTestId('toggle-task-001').click();
  await expect(page.getByTestId('status')).toHaveText('Completed · saved');
  await expect(page.getByTestId('toggle-task-001')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('refresh').click();
  // Wait for the GET to settle; then check the visible result instead of optimistic state.
  await expect
    .poll(async () => {
      const response = await page.request.get(`${api}/todos`);
      return (await response.json()).todos.find((todo) => todo.id === 'task-001').completed;
    })
    .toBe(true);
  await expect(page.getByTestId('toggle-task-001')).toHaveAttribute('aria-checked', 'true');
  await page.reload();
  await expect(page.getByTestId('toggle-task-001')).toHaveAttribute('aria-checked', 'true');
});

test('@acceptance draft typing leaves unchanged row highlights idle', async ({ page }) => {
  await expect(page.getByRole('switch', { name: 'Highlight renders' })).toBeChecked();
  await page.waitForTimeout(1000); // Let the initial 650 ms highlight animation finish.
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('[data-testid^="row-task-"]')];
    const baseline = new Map(rows.map((row) => [row, getComputedStyle(row).borderTopColor]));
    window.__flashedRows = new Set();
    window.__flashObserver = new MutationObserver((records) => {
      for (const record of records) {
        if (
          baseline.has(record.target) &&
          getComputedStyle(record.target).borderTopColor !== baseline.get(record.target)
        ) {
          window.__flashedRows.add(record.target.dataset.testid);
        }
      }
    });
    for (const row of rows)
      window.__flashObserver.observe(row, { attributes: true, attributeFilter: ['style'] });
  });
  await page.getByTestId('draft').pressSequentially('Rehearse', { delay: 75 });
  await expect(page.getByTestId('draft')).toHaveValue('Rehearse');
  const flashed = await page.evaluate(() => {
    window.__flashObserver.disconnect();
    return [...window.__flashedRows];
  });
  expect(flashed, 'Unchanged rows flashed while editing only the draft').toEqual([]);
});
