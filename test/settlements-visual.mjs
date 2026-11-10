// Produce two representative views: a prosperous village square and a city.
export default async function ({ page, screenshot }) {
  await page.waitFor("!!document.querySelector('h1')");
  await page.evaluate('globalThis.__wanderhausNoSave = true');
  const href = await page.evaluate('location.href');
  await page.goto(href.split('?')[0] + '?debug=1');
  await page.waitFor('window.__APP_READY__ === true');
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Begin'))?.click()");
  await page.pause(500);

  const home = await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    g.townWealth.home = 78; g.settings.clouds = false; g.clouds = [];
    g.parked = true; g.parkUntil = g.time + 999;
    g.v.x = g.world.homeTown.x; g.v.y = g.world.homeTown.y;
    g.lastDockKey = ''; g.townT = 0; g.cam.zoom = 3.2; g.toasts = [];
    return g.world.homeTown.name;
  })()`);
  await page.pause(3000);
  await page.evaluate('window.__wanderhaus.toasts = []');
  await page.press('h');
  await page.pause(300);
  await page.evaluate("document.querySelector('.ui-hint')?.style.setProperty('display','none')");
  await screenshot('homeport-prosperity.png');
  await page.press('h');
  await page.pause(250);
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('🏘️ Town'))?.click()");
  await page.pause(500);
  await screenshot('homeport-panel.png');
  // Give someone a reason to be waiting at the gate, for the panel's moving-day card.
  await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    const home = g.world.homeTown;
    let dest = null;
    for (const t of g.nearTowns) if (t.key !== home.key) { dest = t; break; }
    if (dest) {
      g.recordKnown(dest);
      g.moveOffer = null; g.moveCooldown = {};
      const real = Math.random; Math.random = () => 0.01;
      g.residentsVisit(home);
      Math.random = real;
    }
  })()`);
  await page.pause(700);
  await screenshot('homeport-traveller.png');
  await page.press('Escape');

  const city = await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    let c = null;
    for (let ry=-8;ry<=8 && !c;ry++) for (let rx=-8;rx<=8 && !c;rx++) { const t=g.world.townInRegion(rx,ry); if(t?.tier==='city') c=t; }
    g.townWealth[c.key] = 100; g.settings.clouds = false; g.clouds = [];
    g.parked = true; g.parkUntil = g.time + 999;
    g.v.x = c.x; g.v.y = c.y; g.lastDockKey=''; g.townT=0; g.cam.zoom=2.4; g.toasts=[];
    return { name: c.name, key: c.key };
  })()`);
  await page.pause(3500);
  await page.evaluate('window.__wanderhaus.toasts = []');
  await page.press('h');
  await page.pause(300);
  await page.evaluate("document.querySelector('.ui-hint')?.style.setProperty('display','none')");
  await screenshot('city-prosperity.png');
  await page.press('h');
  await page.pause(250);
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('🏘️ Town'))?.click()");
  await page.pause(500);
  await screenshot('city-panel.png');
  console.log(JSON.stringify({ home, city }));
}
