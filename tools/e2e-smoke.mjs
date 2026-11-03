// Browser smoke test for the running app (client on :5173, API on :5000).
// Setup (once):  cd tools && npm i playwright && npx playwright install chromium
// Run:           node tools/e2e-smoke.mjs   (screenshots are written next to this file)
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const OUT = new URL('.', import.meta.url).pathname;
const results = [];
const check = (name, ok, extra = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(String(e)));

const stat = async (label) => {
  const card = page.locator('.card', { has: page.getByText(label, { exact: true }) }).first();
  return (await card.locator('p.font-mono').first().textContent()).trim();
};

await page.goto(BASE);
await page.getByRole('heading', { name: 'A2Z DSA Sheet' }).waitFor();
await page.locator('section.card h2 button').first().waitFor();
check('sheet loads', true);
check('total = 452', (await stat('Total problems')) === '452', await stat('Total problems'));
const stepButtons = await page.locator('section.card h2 button').count();
check('20 step accordions', stepButtons === 20, String(stepButtons));
await page.screenshot({ path: OUT + '01-desktop-light.png', fullPage: false });

// Expand Arrays -> FAQs(Medium) and tick Two Sum
await page.locator('section.card h2 button', { hasText: 'Arrays' }).first().click();
await page.getByRole('button', { name: /FAQs\(Medium\)/ }).click();
const twoSum = page.getByRole('checkbox', { name: 'Mark "Two Sum" as solved' });
await twoSum.click();
await page.getByRole('checkbox', { name: 'Mark "Two Sum" as unsolved' }).waitFor();
check('solved count updates immediately', (await stat('Solved')) === '1', await stat('Solved'));
check('remaining updates', (await stat('Remaining')) === '451');
const arraysHeader = await page.locator('section.card h2 button', { hasText: 'Arrays' }).first().textContent();
check('topic progress shows 1/32', arraysHeader.includes('1/32'), arraysHeader);

// LeetCode link correct + opens in new tab
const lcLink = page.locator('li', { hasText: 'Two Sum' }).first().locator('a[href^="https://leetcode.com"]').first();
check('Two Sum LeetCode link', (await lcLink.getAttribute('href')) === 'https://leetcode.com/problems/two-sum/');
check('links open in new tab', (await lcLink.getAttribute('target')) === '_blank');
const tsRow = page.locator('li', { hasText: '3 Sum' }).first();
await page.screenshot({ path: OUT + '02-arrays-expanded.png' });

// Bookmark 3 Sum, add notes to it
await tsRow.getByRole('button', { name: 'Bookmark' }).click();
await page.getByText('Bookmarked').first().waitFor();
await tsRow.getByRole('button', { name: 'Notes' }).click();
await page.getByRole('dialog').locator('textarea').fill('Sort + two pointers, skip duplicates.');
await page.getByRole('button', { name: 'Save notes' }).click();
await page.getByText('Notes saved').waitFor();
check('notes saved', true);

// Refresh: progress persists
await page.reload();
await page.locator('section.card h2 button').first().waitFor();
await page.waitForFunction(() => document.body.innerText.includes('0.2%'));
check('solved persists after refresh', (await stat('Solved')) === '1');
const stillChecked = await page.getByRole('checkbox', { name: 'Mark "Two Sum" as unsolved' }).count();
check('checkbox still ticked after refresh (sections remembered)', stillChecked === 1);

// Search
await page.getByLabel('Search problems by name').fill('two sum');
await page.waitForFunction(() => /[1-9]\d* problems? match/.test(document.body.innerText), null, { timeout: 5000 }).catch(() => {});
const matchText = await page.getByText(/problems? match/).textContent();
check('search returns results', /^[1-9]\d* problems? match/.test(matchText.trim()), matchText);
await page.screenshot({ path: OUT + '03-search.png' });
await page.getByLabel('Search problems by name').fill('zzzzqqq');
await page.getByText('No problems match these filters').waitFor();
check('empty search state', true);
await page.getByRole('button', { name: 'clear all filters' }).click();

// Status filter
await page.getByLabel('Status', { exact: true }).selectOption('solved');
await page.waitForFunction(() => document.body.innerText.includes('1 problem match'));
check('status=solved filter -> 1', true);
await page.getByLabel('Status', { exact: true }).selectOption('all');

// Difficulty + platform + sort
await page.getByLabel('Level', { exact: true }).selectOption('Pro');
await page.getByLabel('Platform', { exact: true }).selectOption('both');
await page.getByLabel('Sort', { exact: true }).selectOption('title');
await page.waitForFunction(() => /\d+ problems? match/.test(document.body.innerText) && !document.body.innerText.includes('Searching'));
const proBoth = await page.getByText(/problems? match/).textContent();
check('Pro + both platforms + sort by name', /\d+ problems? match/.test(proBoth), proBoth.trim());
await page.screenshot({ path: OUT + '04-filters-sorted.png' });
await page.getByRole('button', { name: 'Clear filters' }).click();

// Bookmarks page
await page.getByRole('link', { name: 'Bookmarks' }).first().click();
await page.getByRole('heading', { name: 'Bookmarks' }).waitFor();
await page.getByText('3 Sum').first().waitFor();
check('bookmark appears on Bookmarks page', true);

// Register (guest -> account keeps progress)
const email = `e2e${Date.now()}@example.com`;
await page.getByRole('link', { name: /Sign in/ }).first().click();
await page.getByLabel('Email').fill(email);
await page.getByLabel('Password').fill('password123');
await page.getByRole('button', { name: 'Create account' }).last().click();
const progEl = page.locator('p', { has: page.getByText('Progress:') });
await progEl.waitFor();
const prog = await progEl.textContent();
check('register keeps guest progress', prog.includes('1/452') && prog.includes('1 bookmarked'), prog.trim());

// Data notes page
await page.getByRole('link', { name: 'About' }).first().click();
await page.getByRole('heading', { name: 'Ankit Tiwari' }).waitFor();
check('about page', true);
await page.getByRole('link', { name: /How the problem data/ }).click();
await page.getByRole('heading', { name: /could not be verified/ }).waitFor();
check('data notes page', true);

// Dark mode
await page.getByRole('link', { name: 'Sheet' }).first().click();
await page.getByRole('button', { name: /Switch to dark theme/ }).click();
check('dark mode class', await page.evaluate(() => document.documentElement.classList.contains('dark')));
await page.screenshot({ path: OUT + '05-desktop-dark.png' });

// Mobile
const m = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
const mp = await m.newPage();
await mp.goto(BASE);
await mp.locator('section.card h2 button').first().waitFor();
await mp.locator('section.card h2 button', { hasText: 'Arrays' }).first().click();
await mp.getByRole('button', { name: /Fundamentals/ }).first().click();
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check('no horizontal scroll on mobile', overflow <= 0, `overflow=${overflow}px`);
await mp.screenshot({ path: OUT + '06-mobile.png', fullPage: false });
await mp.getByRole('button', { name: 'Open menu' }).click();
await mp.screenshot({ path: OUT + '07-mobile-menu.png' });

// API down -> error state
const off = await browser.newContext();
const op = await off.newPage();
await op.route('**/api/**', (r) => r.abort());
await op.goto(BASE);
await op.getByText('Cannot connect to the API').waitFor();
check('API failure shows error state with retry', (await op.getByRole('button', { name: 'Try again' }).count()) === 1);

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
console.log(results.join('\n'));
await browser.close();
