// Save compatibility: v5 residentMemory becomes v6 town memory; v6 movers/bonds/wealth load.
export default async function ({ page, assert, log }) {
  await page.waitFor("!!document.querySelector('h1')");
  const href = await page.evaluate('location.href');
  await page.goto(href.split('?')[0] + '?debug=1');
  await page.waitFor('window.__APP_READY__ === true');
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Begin'))?.click()");
  await page.pause(400);
  await page.evaluate('window.__wanderhaus.save()');
  const v5 = await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    const raw = JSON.parse(localStorage.getItem('wanderhaus-save-v1'));
    raw.v = 5;
    delete raw.townWealth; delete raw.townMemory; delete raw.residentBonds;
    delete raw.movers; delete raw.moveOffer; delete raw.departedByTown; delete raw.movedIn;
    raw.residentMemory = { visits: 7, honks: 4, firstDay: 1, lastDay: 3, lastVisit: 2, lastHonk: 2 };
    raw.lastSave = Date.now();
    globalThis.__wanderhausNoSave = true;
    localStorage.setItem('wanderhaus-save-v1', JSON.stringify(raw));
    return { ok: true };
  })()`);
  assert.ok(v5.ok, 'prepared v5 save');
  await page.reload();
  await page.waitFor('window.__APP_READY__ === true');
  await page.pause(500);
  const migrated = await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    return { visits: g.townMemory.home?.visits, honks: g.townMemory.home?.honks, trades: g.townMemory.home?.trades, legacy: g.residentMemory.visits, wealth: Object.keys(g.townWealth).length, movers: g.movers.length };
  })()`);
  log('migrated: ' + JSON.stringify(migrated));
  assert.equal(migrated.visits, 7, 'v5 residentMemory should become Homeport town memory');
  assert.equal(migrated.honks, 4, 'v5 honks should migrate');
  assert.equal(migrated.legacy, 7, 'legacy residentMemory should stay readable');
  assert.equal(migrated.wealth, 0, 'v5 should start with no town wealth');

  await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    const raw = JSON.parse(localStorage.getItem('wanderhaus-save-v1'));
    const def = g.residents.find(r => r.townKey === 'home').def;
    raw.v = 6;
    raw.townWealth = { home: 42 };
    raw.townMemory = { ...(raw.townMemory || {}), home: { visits: 9, honks: 5, trades: 12, firstDay: 1, lastDay: 4, lastVisit: 3, lastHonk: 2 } };
    raw.residentBonds = { mira: { met: 3, honks: 2, rides: 1, lastDay: 4 } };
    raw.departedByTown = { home: ['mira'] };
    raw.movedIn = { '1:1': [{ ...def, id: '1:1:new', name: 'Newcomer' }] };
    raw.movers = [{ def: { ...def, id: '1:1:ride', name: 'Rider' }, fromKey: 'home', fromName: 'Homeport', toKey: '1:1', toName: 'Elsewhere', acceptedAt: 2, gift: { coins: 12 } }];
    raw.moveOffer = null;
    raw.lastSave = Date.now();
    globalThis.__wanderhausNoSave = true;
    localStorage.setItem('wanderhaus-save-v1', JSON.stringify(raw));
  })()`);
  await page.reload();
  await page.waitFor('window.__APP_READY__ === true');
  await page.pause(500);
  const restored = await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    return {
      wealth: g.townWealth.home, visits: g.townMemory.home?.visits, trades: g.townMemory.home?.trades,
      bond: g.residentBonds.mira, departed: g.departedByTown.home, movedIn: g.movedIn['1:1']?.[0]?.name,
      mover: g.movers[0]?.def?.name, to: g.movers[0]?.toKey,
    };
  })()`);
  log('restored: ' + JSON.stringify(restored));
  assert.equal(restored.wealth, 42, 'town wealth should load');
  assert.equal(restored.visits, 9, 'town memory should load');
  assert.equal(restored.trades, 12, 'trade memory should load');
  assert.equal(restored.bond.met, 3, 'resident bond should load');
  assert.ok(restored.departed.includes('mira'), 'departed residents should stay departed');
  assert.equal(restored.movedIn, 'Newcomer', 'moved-in residents should load');
  assert.equal(restored.mover, 'Rider', 'passengers should survive a save');
  assert.equal(restored.to, '1:1', 'passenger destination should survive');
}
