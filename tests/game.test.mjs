import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { route, footprintDistance, formationSlots } from '../src/navigation.mjs';
import { storeMatch, readMatch, removeMatch } from '../src/save.mjs';
import { createSprites } from '../src/sprites.mjs';

const source = readFileSync(new URL('../src/game.mjs', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '');
function match() {
  const elements = new Map();
  const data = new Map();
  const storage = {
    setItem: (key, value) => data.set(key, value),
    getItem: key => data.get(key),
    removeItem: key => data.delete(key)
  };
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      addEventListener() {}, setAttribute() {}, style: {}, dataset: {},
      classList: { add() {}, remove() {} },
      getContext() { return {}; }, getBoundingClientRect() { return { width: 0, height: 0 }; }
    });
    return elements.get(id);
  }
  const simulate = runInNewContext(`${source}
    ({ reset, orderAttack, orderHarvest, orderBuild, train, saveMatch, resumeSaved,
       unit, building, findKeep, moveFormation, selectOne, buildPlace, handleAction, cellHit,
       state: () => ({ units, buildings, nodes, effects, explored, gold, wood, redStock, gameTime, wave, gameState }),
       advance: seconds => { for (let i = 0; i < seconds * 20; i++) update(.05); } });`, {
    document: { getElementById: element, querySelectorAll: () => [], addEventListener() {} },
    window: { localStorage: storage, addEventListener() {} },
    performance: { now: () => 0 }, requestAnimationFrame() {},
    route, footprintDistance, formationSlots, storeMatch, readMatch, removeMatch, createSprites,
    playSound() {}, setMuted() {}, unlockAudio() {}
  });
  simulate.reset();
  return simulate;
}

test('routes around a blocked corner to melee range of a large footprint', () => {
  const width = 9;
  const grid = new Uint8Array(width * 8);
  const keep = { kind: 'building', x: 5, y: 2, w: 3, h: 3 };
  for (let y = 2; y < 5; y++) grid.fill(1, y * width + 5, y * width + 8);
  grid[2 * width + 2] = 1;
  grid[3 * width + 1] = 1;
  const distance = (x, y) => footprintDistance(x, y, keep);
  const path = route(grid, width, 8, 1.5, 2.5, (x, y) => distance(x, y) <= 1,
    (x, y) => Math.max(0, distance(x, y) - 1));
  assert.notDeepEqual(path[0], { x: 2.5, y: 3.5 });
  assert.ok(distance(path.at(-1).x, path.at(-1).y) <= 1);
  assert.ok(path.every(({ x, y }) => !grid[Math.floor(y) * width + Math.floor(x)]));
});

test('formations allocate distinct walkable slots even beside obstacles', () => {
  const slots = formationSlots(6, 7, 24, 20, 20, x => x === 6, Math.PI / 3);
  assert.equal(slots.length, 24);
  assert.equal(new Set(slots.map(slot => slot.key)).size, 24);
  assert.ok(slots.every(slot => Math.floor(slot.x) !== 6));
});

test('worker orders gather different resources, construct, and train within supply', () => {
  const game = match();
  const initial = game.state();
  const workers = initial.units.filter(u => u.team === 'blue' && u.type === 'worker');
  game.orderHarvest(workers[0], initial.nodes.find(n => n.type === 'tree' && n.x === 3 && n.y === 8));
  game.orderHarvest(workers[1], initial.nodes.find(n => n.type === 'gold' && n.x === 11 && n.y === 10));
  game.selectOne(workers[2]);
  game.handleAction('build:barracks');
  game.buildPlace(5, 15);
  const barracks = game.state().buildings.find(b => b.type === 'barracks' && b.team === 'blue');
  assert.ok(barracks?.under);
  game.advance(14);
  assert.equal(barracks.under, false);
  assert.ok(game.state().wood > initial.wood - 160);
  assert.ok(game.state().gold > initial.gold - 120);
  assert.equal(game.train(barracks, 'worker'), false);
  assert.equal(game.train(barracks, 'guard'), true);
  assert.equal(game.train(barracks, 'archer'), true);
  assert.equal(game.train(barracks, 'guard'), false);
  game.advance(21);
  assert.ok(game.state().units.some(u => u.type === 'archer'));
});

test('CPU establishes a working economy before paying for and launching a raid', () => {
  const game = match();
  assert.equal(game.state().buildings.some(b => b.team === 'red' && b.type === 'barracks'), false);
  game.advance(110);
  const state = game.state();
  assert.ok(state.buildings.some(b => b.team === 'red' && b.type === 'barracks' && !b.under));
  assert.ok(state.buildings.some(b => b.team === 'red' && b.type === 'farm'));
  assert.ok(state.units.some(u => u.team === 'red' && u.type === 'worker' && u.order?.kind === 'harvest'));
  assert.ok(state.units.some(u => u.order?.raid));
  assert.ok(state.wave >= 1);
  assert.ok(state.redStock.gold >= 0 && state.redStock.wood >= 0);
});

test('save resumes queues, time, fog and in-flight combat', () => {
  const game = match();
  assert.equal(game.train(game.findKeep('blue'), 'worker'), true);
  const archer = game.unit('blue', 'archer', 22.5, 13.5);
  const enemy = game.findKeep('red');
  archer.x = 25.5;
  game.orderAttack(archer, enemy);
  game.advance(1);
  const before = JSON.stringify(game.state());
  assert.equal(game.saveMatch(), true);
  game.advance(8);
  game.resumeSaved();
  assert.equal(JSON.stringify(game.state()), before);
  game.advance(8);
  assert.equal(game.findKeep('blue').queue.length, 0);
});

test('a direct assault resolves victory and an ignored enemy can win', () => {
  const game = match();
  const keep = game.findKeep('red');
  assert.equal(game.cellHit(keep.x + 1, keep.y + 1), null);
  for (let i = 0; i < 12; i++) {
    const soldier = game.unit('blue', i % 2 ? 'guard' : 'archer', 19.5, 10.5 + i * .65);
    game.orderAttack(soldier, keep);
  }
  game.advance(65);
  assert.equal(game.state().gameState, 'won');
  const unattended = match();
  unattended.advance(620);
  assert.equal(unattended.state().gameState, 'lost');
});

test('recruit and win using the starting settlement', () => {
  const game = match();
  const state = game.state();
  const workers = state.units.filter(u => u.team === 'blue' && u.type === 'worker');
  const send = (worker, type, x, y) => game.orderHarvest(worker,
    state.nodes.find(n => n.type === type && n.x === x && n.y === y));
  const build = (type, x, y) => {
    game.selectOne(workers[2]);
    game.handleAction('build:' + type);
    game.buildPlace(x, y);
    game.advance(12);
    assert.ok(game.state().buildings.some(b => b.team === 'blue' && b.type === type && b.x === x && !b.under));
  };
  send(workers[0],'tree',3,8);
  send(workers[1],'gold',11,10);
  build('barracks',5,15);
  build('farm',7,8);
  build('tower',10,13);
  build('tower',10,14);
  build('farm',5,7);
  const barracks = game.state().buildings.find(b=>b.team==='blue' && b.type==='barracks');
  for (let i=0;i<18;i++) {
    game.train(barracks,i%3===0?'guard':'archer');
    game.advance(9);
  }
  const army = game.state().units.filter(u => u.team === 'blue' && u.type !== 'worker');
  game.moveFormation(army,25,14,true);
  game.advance(25);
  const target = game.findKeep('red');
  if (target) for (const u of army.filter(u => u.hp > 0)) game.orderAttack(u, target);
  game.advance(40);
  assert.equal(game.state().gameState, 'won');
});

test('taps hit unit heads and roofs in sprite draw order', () => {
  const game = match();
  const tower = game.building('blue', 'tower', 18, 14);
  assert.equal(game.cellHit(18.5, 14 - 6 / 48), tower);
  const guard = game.unit('blue', 'guard', 18.5, 15.2);
  assert.equal(game.cellHit(18.5, guard.y - 30 / 48), guard);
});
