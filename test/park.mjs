// Mouse-only movement: left-click must not redirect the house, right-click sets a waypoint,
// and Park/Resume stops and restarts the autopilot.
export default async function ({ page, assert, screenshot, log }) {
  await page.waitFor("!!document.querySelector('h1')");
  await page.evaluate('globalThis.__wanderhausNoSave = true');
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Begin'))?.click()");
  await page.waitFor("window.__APP_READY__ === true");
  await page.pause(300);

  const mouse = (type, fx, fy, button = 0) => page.evaluate(`(() => {
    const cv = document.querySelector('canvas');
    const r = cv.getBoundingClientRect();
    cv.dispatchEvent(new MouseEvent('${type}', { bubbles: true, cancelable: true, button: ${button}, clientX: r.left + r.width * ${fx}, clientY: r.top + r.height * ${fy} }));
  })()`);

  // A left-click in the world (the usual way to focus the window) must not create a waypoint.
  await mouse('click', 0.86, 0.82);
  await page.pause(250);
  assert.ok(!(await page.text('body')).includes('To waypoint'), 'left-click should not redirect the house');

  // A right-click does.
  await mouse('contextmenu', 0.86, 0.82, 2);
  await page.waitFor("document.body.innerText.includes('To waypoint')");
  log('right-click waypoint set');

  // Park, then resume from the same mouse-only button.
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('⏸ Park'))?.click()");
  await page.waitFor("document.body.innerText.includes('Parked')");
  assert.ok((await page.text('body')).includes('Resume'), 'the Park button should become Resume');
  await screenshot('parked.png');

  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('▶ Resume'))?.click()");
  await page.waitFor("document.body.innerText.includes('⏸ Park')");
  assert.ok(!(await page.text('body')).includes('▶ Resume'), 'Resume should turn back into Park');
  log('park/resume verified');
}
