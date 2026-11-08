export default async function ({ page, assert, screenshot, log }) {
  await page.waitFor("!!document.querySelector('h1')");
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Begin'))?.click()");
  await page.waitFor("document.body.innerText.includes('Wish You Were Here')");
  const body = await page.text('body');
  assert.ok(body.includes('Wish You Were Here'), 'expected the first-postcard milestone toast');
  log('firsts toast found');
  await screenshot('firsts.png');
}
