// Probe settlement scale, generated residents, path routes, prosperity and resident moves.
export default async function ({ page, assert, screenshot, log }) {
  await page.waitFor("!!document.querySelector('h1')");
  await page.evaluate('globalThis.__wanderhausNoSave = true');
  const href = await page.evaluate('location.href');
  await page.goto(href.split('?')[0] + '?debug=1');
  await page.waitFor('window.__APP_READY__ === true');
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Begin'))?.click()");
  await page.pause(700);

  const state = await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    const home = g.world.homeTown;
    const plan = g.settlementPlan(home);
    const sample = g.residents.slice(0, 8).map(r => ({ name: r.def.name, role: r.def.role, trait: r.def.trait, town: r.townKey, route: r.route.length, state: r.state }));
    const routes = g.residents.map(r => r.route.length);
    return {
      home: { tier: home.tier, pop: home.pop, houses: plan.houses.length, radius: plan.radius, nodes: plan.pathNodes.length, edges: plan.pathEdges.length, roads: plan.roads.length, gate: plan.gate, approach: g.townApproach(home) },
      residents: g.residents.length, sample, maxRoute: Math.max(...routes), cats: Object.keys(g.townCats),
    };
  })()`);
  assert.ok(state.home.houses === 6, 'Homeport should have six houses');
  assert.ok(state.home.nodes > 8 && state.home.edges > 8 && state.home.roads > 8, 'settlement should have a path network');
  assert.ok(Math.hypot(state.home.approach.x - state.home.gate.x, state.home.approach.y - state.home.gate.y) < 55, 'autopilot should aim for the settlement gate');
  assert.ok(state.residents >= 6, 'Homeport should have residents');
  assert.ok(state.sample.every((r) => r.name && r.role && r.trait), 'residents should have names, roles and traits');
  assert.ok(state.maxRoute > 1, 'at least some residents should be following multi-node paths');
  log(JSON.stringify(state));

  const survey = await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    const out = {}, styles = new Set();
    for (let ry = -14; ry <= 14; ry++) for (let rx = -14; rx <= 14; rx++) {
      const t = g.world.townInRegion(rx, ry);
      if (!t) continue;
      styles.add(g.townStyle(t).name);
      if (out[t.tier]) continue;
      const p = g.settlementPlan(t);
      out[t.tier] = { key: t.key, name: t.name, pop: t.pop, houses: p.houses.length, radius: p.radius, nodes: p.pathNodes.length, roads: p.roads.length, style: g.townStyle(t).name, biome: t.biome };
    }
    return { tiers: out, styles: [...styles] };
  })()`);
  const tiers = survey.tiers;
  log('tiers found: ' + JSON.stringify(tiers));
  log('architecture styles: ' + JSON.stringify(survey.styles));
  assert.ok(tiers.hamlet || tiers.village, 'expected a small settlement');
  assert.ok(tiers.city && tiers.city.houses >= 12, 'expected a sprawling city');
  assert.ok(survey.styles.length >= 2, 'biomes should produce different architecture');

  // Park exactly on Homeport and let the dock state settle before opening the panel.
  await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    g.parked = true; g.parkUntil = g.time + 999;
    g.v.x = g.world.homeTown.x; g.v.y = g.world.homeTown.y; g.lastDockKey = '';
    g.townT = 0;
  })()`);
  await page.pause(700);
  const docked = await page.evaluate('window.__wanderhaus.docked?.key');
  assert.equal(docked, 'home', 'house should dock at Homeport');
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('🏘️ Town'))?.click()");
  await page.pause(500);
  const panel = await page.text('body');
  assert.ok(panel.includes('Around Homeport'), 'town panel should list residents');
  assert.ok(panel.includes('Prosperity') || panel.includes('humble') || panel.includes('comfortable'), 'town panel should show prosperity');
  assert.ok(panel.includes('Mira'), 'town panel should name a resident');
  await screenshot('settlements-panel.png');

  // Trading fills the town budget and its market memory.
  const wealth = await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    const home = g.world.homeTown;
    const before = g.townWealth.home ?? 0;
    const stockBefore = g.townStock(home).length;
    const damageBefore = g.townDefense(home).damage;
    g.res.wood = Math.max(g.res.wood, 600);
    g.sell(home, 'wood', 260);
    return {
      before, after: g.townWealth.home ?? 0, trades: g.townMemory.home?.trades ?? 0,
      stockBefore, stockAfter: g.townStock(home).length, damageBefore, damageAfter: g.townDefense(home).damage,
    };
  })()`);
  log('wealth: ' + JSON.stringify(wealth));
  assert.ok(wealth.after > wealth.before, 'selling should add town wealth');
  assert.ok(wealth.trades >= 40, 'selling should add town trade memory');
  assert.ok(wealth.stockAfter >= wealth.stockBefore, 'prosperity should not reduce stock');
  assert.ok(wealth.damageAfter >= wealth.damageBefore, 'prosperity should not weaken the watch');

  // Mark a destination known, then make a resident ask for a lift deterministically.
  const offered = await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    const home = g.world.homeTown;
    let dest = null;
    for (const t of g.nearTowns) if (t.key !== home.key) { dest = t; break; }
    if (!dest) return null;
    g.recordKnown(dest);
    g.moveOffer = null;
    g.moveCooldown = {};
    const real = Math.random;
    Math.random = () => 0.01;
    g.residentsVisit(home);
    Math.random = real;
    return { dest: dest.key, name: dest.name, offer: g.moveOffer ? grepOffer(g.moveOffer) : null };
    function grepOffer(o) { return { name: o.def.name, from: o.fromKey, to: o.toKey, toName: o.toName }; }
  })()`);
  log('offer: ' + JSON.stringify(offered));
  assert.ok(offered && offered.offer, 'a resident should ask for a lift');
  await page.pause(250);
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('🏘️ Town'))?.click()");
  await page.pause(250);
  await page.evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Take them aboard'))?.click()");
  await page.pause(250);
  const aboard = await page.evaluate('({ movers: window.__wanderhaus.movers.length, name: window.__wanderhaus.movers[0]?.def.name, offer: !!window.__wanderhaus.moveOffer })');
  assert.equal(aboard.movers, 1, 'accepting should put the resident aboard');
  assert.equal(aboard.offer, false, 'accepting should close the offer');
  await screenshot('settlements-aboard.png');

  // Take them to the destination; the town should gain a resident and the player a gift.
  const dropoff = await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    const mover = g.movers[0];
    const dest = g.nearTowns.find(t => t.key === mover.toKey) || null;
    if (!dest) return { error: 'destination not near' };
    g.v.x = dest.x; g.v.y = dest.y; g.lastDockKey = ''; g.townT = 0; g.parked = true; g.parkUntil = g.time + 999;
    return { key: dest.key, name: dest.name, id: mover.def.id };
  })()`);
  await page.pause(900);
  const arrived = await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    const d = g.docked;
    return { docked: d?.key, movers: g.movers.length, movedIn: d ? (g.movedIn[d.key] ?? []).some(x => x.id === ${JSON.stringify(dropoff.id)}) : false, residents: d ? g.residents.filter(r => r.townKey === d.key).length : 0 };
  })()`);
  log('dropoff: ' + JSON.stringify({ dropoff, arrived }));
  assert.equal(arrived.movers, 0, 'the mover should leave the house at the destination');
  assert.ok(arrived.movedIn, 'the destination should remember the new resident');
  await screenshot('settlements-dropoff.png');

  // A city at a glance.
  const cityKey = tiers.city.key;
  await page.evaluate(`(() => {
    const g = window.__wanderhaus;
    const t = g.world.townInRegion(${Number(cityKey.split(':')[0])}, ${Number(cityKey.split(':')[1])});
    g.parked = true; g.parkUntil = g.time + 999;
    g.v.x = t.x; g.v.y = t.y; g.lastDockKey = ''; g.townT = 0;
    g.cam.zoom = 2.2;
  })()`);
  await page.pause(900);
  await page.evaluate('window.__wanderhaus.residentPhase');
  await page.press('h');
  await page.pause(250);
  await screenshot('settlements-city.png');
}
