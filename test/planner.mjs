// Supplies & Plans: set a chassis goal from the Workshop, see it in the HUD/Supplies
// screen, and keep a per-resource collection limit through a close/reopen cycle.
export default async function ({ page, assert, screenshot, log }) {
  await page.waitFor("!!document.querySelector('h1')");
  await page.evaluate('globalThis.__wanderhausNoSave = true');
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Begin'))?.click()");
  await page.waitFor("window.__APP_READY__ === true");
  await page.pause(300);

  // Open the Workshop and plan one chassis expansion.
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Workshop'))?.click()");
  await page.waitFor("document.body.innerText.toLowerCase().includes('chassis')");
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Chassis')?.click()");
  await page.waitFor("document.body.innerText.includes('Max 7×5')");
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === '🎯 Plan')?.click()");
  await page.waitFor("document.body.innerText.includes('🎯 Planned')");
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === '✕')?.click()");
  await page.pause(150);

  // The goal is visible on the HUD without being docked.
  await page.waitFor("document.body.innerText.includes('Chassis expansion')");
  assert.ok((await page.text('body')).includes('Chassis expansion'), 'HUD should show the active plan');

  // Open Supplies with the I hotkey; it works anywhere, not only in town.
  await page.press('KeyI');
  await page.waitFor("document.body.innerText.includes('Supplies & Plans')");
  const supplies = await page.text('body');
  assert.ok(supplies.includes('Chassis expansion'), 'Supplies should show the active chassis plan');
  assert.ok(supplies.includes('Gathering…'), 'the plan should show progress');
  await screenshot('supplies-plan.png');

  // Set a collection limit on the first resource row (Wood) and verify it survives a reopen.
  await page.evaluate(`document.querySelector('input[placeholder="∞"]')?.focus()`);
  await page.type('5');
  await page.pause(100);
  const cap = await page.evaluate(`document.querySelector('input[placeholder="∞"]')?.value`);
  assert.equal(cap, '5', 'the collection limit should accept a number');

  await page.press('Escape');
  await page.pause(150);
  await page.press('KeyI');
  await page.waitFor("document.body.innerText.includes('Supplies & Plans')");
  const reopened = await page.evaluate(`document.querySelector('input[placeholder="∞"]')?.value`);
  assert.equal(reopened, '5', 'the collection limit should persist while the panel is closed');
  await screenshot('supplies-limit.png');

  // Clearing the plan puts the Supplies card back to its empty state.
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Clear plan')?.click()");
  await page.pause(100);
  assert.ok((await page.text('body')).includes('No plan yet'), 'clearing the plan should reset the plan card');
  log('chassis plan, HUD goal bar, and collection limit verified');
}
