// LOOK-DEV SHOWCASE for src/shots/lib/world.js — every set piece in its key states (not part of the film).
//   SF_QUERY=glscale=0.5 node render/stills.mjs --review --sheet --every 0.5 --only _world.js --out dist/review-world
import { shot, beats, kf, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
const { THREE } = W;

const S = (id, act, dur, bars, build) => shot({ id, dur, act, three(ctx) { ctx.fx.bars(0, bars); return build(ctx); } });
const T = (ctx, lt) => ctx.shot.start + lt;

// 1. ACT I master: the dark hall, one cold station at 160u, the clay cursor blinking on the tick.
S('w-hall-dark', 'I', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'I' });
  const H = W.hall(scene, { state: 'dark', parts: { cursor: true } });
  return { scene, camera, ...W.grade('I'), update(lt) {
    const t = T(ctx, lt);
    H.cursor.update(lt, { on: W.blink(t), k: 10 });
    H.update(lt);
    camFX(camera, t, W.camHallWide(camera, lt, { dur: ctx.T, t, handheld: 0.3 }));
  } };
});

// 2. PLANT 1: telephoto human at the CODE station, the unlit foreman as a dark stepped wall behind.
S('w-plant', 'I', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'I' });
  const H = W.hall(scene, { state: 'dark', parts: { cursor: true, human: 'I', tower: true } });
  return { scene, camera, ...W.grade('I'), update(lt) {
    const t = T(ctx, lt);
    H.cursor.update(lt, { on: W.blink(t), k: 10 });
    H.tower.update(lt, { count: 1, k: lt < 1 ? 3 : 0.3 * W.blink(t), t });
    H.human.update(lt, {});
    H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.4 });
    H.update(lt);
    const p = [-19.6, 3, 200 - 8 * lt / ctx.T];
    W.camPlant(camera, scene, p, [-19.6, 20, -200], W.FOV[135]);
    W.handheld(camera, t, 0.3);
    camFX(camera, t, W.FOV[135]);
  } };
});

// 3. The 1,000-orb code tower (wave one) with the human dot at its base and the ledger row above.
S('w-tower', 'I', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'I' });
  const H = W.hall(scene, { state: 'dark', parts: { cursor: true, human: 'I', tower: true, ledger: true } });
  return { scene, camera, ...W.grade('I'), update(lt) {
    const t = T(ctx, lt);
    H.cursor.update(lt, { on: 1, k: 10 });
    H.tower.update(lt, { count: lerp(400, 1000, clamp(lt / 1.2)), k: 10, crest: clamp((lt - 1.2) * 5), t });
    H.human.update(lt, {});
    H.ledger.update(lt, { fill: clamp((lt - 1.4) * 15), seam: lt > 1.4 ? 10 - 7 * clamp((lt - 1.4) * 2) : 3, burst: lt - 1.4 });
    H.update(lt);
    const u = ease.inOut(clamp(lt / ctx.T));
    camFX(camera, t, W.camLook(camera, [-19.6, lerp(2, 24, u), lerp(30, 46, u)], [-19.6, 15, 0], W.FOV[35]));
  } };
});

// 4. MONTH gate FPV (gate 3), CODE glow ahead through the gates.
S('w-gate', 'I', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'I' });
  const H = W.hall(scene, { state: 'dark', parts: { gates: true, tower: true, cursor: true } });
  return { scene, camera, ...W.grade('I'), update(lt) {
    const t = T(ctx, lt);
    H.gates.update(lt, { pips: [1, 2, 3, 0, 0] });
    H.tower.update(lt, { count: 100, k: 10, t });
    H.cursor.update(lt, { on: 1 });
    H.update(lt);
    camFX(camera, t, W.camGateFPV(camera, lt * 0.5, 3));
  } };
});

// 5. MIDPOINT top-down: dark 7-station line, the CODE strip draws in place (16%).
S('w-mid-top', 'MID', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'MID' });
  const H = W.hall(scene, { state: 'dark', parts: { banks: false } });
  return { scene, camera, ...W.grade('MID'), update(lt) {
    const t = T(ctx, lt);
    const d = clamp((lt - 0.1) / 0.4);
    scene.fog.density = W.fogKeep(545, 0.85);
    H.line.update(lt, { lit: 0, dim: 0.25, strips: [0, 0, 1, 0, 0, 0, 0], draw: [0, 0, ease.out(d), 0, 0, 0, 0], codeK: 8 });
    H.update(lt);
    camFX(camera, t, W.camLineTop(camera, lt, { dur: ctx.T }));
  } };
});

// 6. MASTER A: REVIEW queue becomes a tower (160 cards, 80u), worm's-eye, Dutch -8.
S('w-review-worm', 'II', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'II' });
  const H = W.hall(scene, { state: 'dark', parts: { towers: { review: 1200, test: 640 }, cursor: true } });
  return { scene, camera, ...W.grade('II'), update(lt) {
    const t = T(ctx, lt);
    H.towers.update(lt, { review: lerp(110, 160, clamp(lt / 1.5)), test: 120, t });
    H.cursor.update(lt, { on: 1, k: 3 });
    H.line.update(lt, { lit: 0, red: [0, 0, 0, 0.6, 0, 0, 0] });
    H.update(lt);
    camFX(camera, t, W.camReviewWorm(camera, lt, { dur: ctx.T, t, handheld: 0.3 }));
  } };
});

// 7. MASTER C: the human under the 300u REVIEW tower, TEST tower right, red alarm banks overhead.
S('w-human-tower', 'II', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'II', fog: 0.008 });
  const H = W.hall(scene, { state: 'alarm', parts: { towers: { review: 1200, test: 640 }, human: 'II' } });
  return { scene, camera, ...W.grade('II'), update(lt) {
    const t = T(ctx, lt);
    H.towers.update(lt, { review: 600, test: 320, t });
    H.human.update(lt, {});
    H.banks.update(lt, { on: 0, alarm: 1, t });
    H.line.update(lt, { lit: 0, red: [0.3, 0.3, 0.5, 1, 1, 0.6, 0.3] });
    H.update(lt, { alarm: 1 });
    camFX(camera, t, W.camHumanUnderTower(camera, lt, { dur: ctx.T, t, handheld: 0.3 }));
  } };
});

// 8. MASTER E: error map top-down, 300 ice orbs, red spark, 17 tendrils.
S('w-error', 'II', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'II' });
  const H = W.hall(scene, { state: 'dark', parts: { banks: false, pillars: false } });
  const E = W.errorMap({}); scene.add(E.group);
  return { scene, camera, ...W.grade('II'), update(lt) {
    const t = T(ctx, lt);
    scene.fog.density = W.fogKeep(160, 0.85);
    E.update(lt, { grow: clamp(lt / 1.6), spark: clamp(lt / 1.6), t });
    H.line.update(lt, { lit: 0, dim: 0.15 });
    H.update(lt);
    camFX(camera, t, W.camErrorTop(camera));
  } };
});

// 9. LIGHTS ON: one-point aisle, banks slam on one per 0.25 s.
S('w-aisle-on', 'III', beats(4), 0, (ctx) => {
  const { scene, camera } = W.stage({ act: 'III' });
  const H = W.hall(scene, { state: 'dark', parts: {} });
  return { scene, camera, ...W.bankGrade(8), update(lt) {
    const t = T(ctx, lt);
    const on = W.BANK_X.map((_, i) => W.ignite(lt - 0.05 - i * 0.22));
    H.banks.update(lt, { on, t });
    H.line.update(lt, { lit: on.slice(0, 7).map((v) => clamp(v)), strips: on.slice(0, 7).map((v) => clamp(v)) });
    H.update(lt, { lit: clamp(lt / 1.8) });
    camFX(camera, t, W.camAisle(camera, lt));
  } };
});

// 10. MIRROR: iii-line-runs — the same REVIEW tower lit and flowing, Dutch rights to level.
S('w-line-runs', 'III', beats(4), 0, (ctx) => {
  const { scene, camera } = W.stage({ act: 'III' });
  const H = W.hall(scene, { state: 'lit', parts: { towers: { review: 1200, test: 640 }, cursor: true } });
  return { scene, camera, ...W.grade('III'), update(lt) {
    const t = T(ctx, lt);
    H.towers.update(lt, { review: 160, test: 120, lit: 1, t });
    H.banks.update(lt, { on: 1, t });
    H.cursor.update(lt, { on: W.blink(t, { bpm: 150, div: 2 }) });
    H.update(lt);
    camFX(camera, t, W.camReviewWorm(camera, lt, { dur: ctx.T, mirror: true }));
  } };
});

// 11. FACTORY top-down zoom: lit line, banks, rails flowing, foreman footprint still dark at the top edge.
S('w-factory-top', 'III', beats(4), 0, (ctx) => {
  const { scene, camera } = W.stage({ act: 'III', fog: 0.002 });
  const H = W.hall(scene, { state: 'lit', parts: { rails: true, towers: { review: 400, test: 320 } } });
  return { scene, camera, ...W.grade('III'), update(lt) {
    const t = T(ctx, lt);
    H.rails.update(lt, { cascade: 99, flow: 30, t, k: 4 });
    H.towers.update(lt, { review: 60, test: 40, lit: 1, t });
    H.banks.update(lt, { on: 1, t });
    H.foreman.update(lt, { lit: 0, rimColor: W.C.amber, rimK: 0.3 });
    H.banks.update(lt, { housing: false });
    H.update(lt);
    const d = 120 * Math.pow(520 / 120, ease.inOut(clamp(lt / ctx.T)));
    scene.fog.density = W.fogKeep(d, 0.75);
    camFX(camera, t, W.camTop(camera, 1.4, d, 0.01, W.FOV[35]));
  } };
});

// 12. THE FOREMAN — hero ignition, low angle 14mm with lens shift; threads unfurl; the human raises the brief.
S('w-foreman-hero', 'III', beats(6), 0, (ctx) => {
  const { scene, camera } = W.stage({ act: 'III' });
  const H = W.hall(scene, { state: 'lit', parts: { threads: true } });
  const hu = W.humanAnchor({ act: 'III', brief: true, facing: Math.PI }); scene.add(hu.group);
  H.extra.push(...hu.sources());
  return { scene, camera, ...W.grade('III', { bloom: { strength: 1.3, threshold: 0.72 } }), update(lt) {
    const t = T(ctx, lt);
    H.banks.update(lt, { on: 1, t });
    H.foreman.update(lt, { lit: lt - 0.1 });
    H.threads.update(lt, { reveal: W.SUBLEAD_X.map((_, j) => clamp((lt - 0.7 - Math.abs(j - 5.5) * 0.03) / 0.7)), t, flow: clamp((lt - 1.3) / 0.5), brief: lt > 1.4 ? clamp((lt - 1.4) / 1.2) : -1 });
    hu.update(lt, { raise: clamp((lt - 0.6) / 0.6), briefHide: lt > 1.4 });
    H.update(lt);
    camFX(camera, t, W.camForemanHero(camera, lt, { dur: ctx.T }));
  } };
});

// 13. Foreman thread map top-down: 12 threads -> 12 sub-leads -> particle flow down to the stations.
S('w-foreman-top', 'III', beats(4), 0, (ctx) => {
  const { scene, camera } = W.stage({ act: 'III' });
  const H = W.hall(scene, { state: 'lit', parts: { threads: true } });
  return { scene, camera, ...W.grade('III'), update(lt) {
    const t = T(ctx, lt);
    H.banks.update(lt, { on: 1, t });
    H.foreman.update(lt, { lit: 5 });
    H.threads.update(lt, { t });
    H.update(lt);
    scene.fog.density = W.fogKeep(330, 0.7);
    camFX(camera, t, W.camTop(camera, 0, 320, -110, W.FOV[35], 3 * lt));
  } };
});

// 14. Grand wide: the lit foreman + threads + the whole flowing line read as one machine.
S('w-orbit', 'III', beats(4), 0, (ctx) => {
  const { scene, camera } = W.stage({ act: 'III' });
  const H = W.hall(scene, { state: 'lit', parts: { threads: true, rails: true } });
  return { scene, camera, ...W.grade('III'), update(lt) {
    const t = T(ctx, lt);
    H.banks.update(lt, { on: 1, t });
    H.rails.update(lt, { cascade: 99, flow: 30, t, k: 3 });
    H.foreman.update(lt, { lit: 5, hourRing: 18 });
    H.threads.update(lt, { t });
    H.update(lt);
    const u = lt / ctx.T;
    camFX(camera, t, W.camLook(camera, [lerp(-120, -110, u), lerp(140, 132, u), lerp(80, 72, u)], [0, 60, -100], W.FOV[35]));
  } };
});

// 15. GRAPH (top-down 35mm, yaw 4 deg/s): neutral ivory hub + 12 workers, pulses hop edge by edge.
S('w-graph', 'III', beats(4), 0, (ctx) => {
  const { scene, camera } = W.stage({ act: 'III' });
  const H = W.hall(scene, { state: 'lit', parts: { line: false, banks: false, foreman: false } });
  const Gd = W.graphDiagram({ center: [0, 2, 0] }); scene.add(Gd.group);
  return { scene, camera, ...W.grade('III'), update(lt) {
    const t = T(ctx, lt);
    Gd.update(lt, { t: lt });
    H.update(lt, { lit: 1 });
    camFX(camera, t, W.camTop(camera, 0, 70, 0, W.FOV[35], 4 * lt));
  } };
});

// 16. HIERARCHY crane.
S('w-hierarchy', 'III', beats(4), 0, (ctx) => {
  const { scene, camera } = W.stage({ act: 'III' });
  const H = W.hall(scene, { state: 'lit', parts: { line: false, banks: false, foreman: false } });
  const Hi = W.hierarchy({}); Hi.group.scale.setScalar(1.3); scene.add(Hi.group);
  return { scene, camera, ...W.grade('III'), update(lt) {
    const t = T(ctx, lt);
    Hi.update(lt, { align: [clamp((lt - 1.1) * 8), clamp((lt - 0.8) * 8), clamp((lt - 0.5) * 8)], beams: clamp(lt * 2) });
    H.update(lt, { lit: 1 });
    const u = ease.inOut(clamp(lt / ctx.T));
    camFX(camera, t, W.camLook(camera, [0, lerp(1, 30, u), lerp(40, 60, u)], [0, 12, 0], W.FOV[24]));
  } };
});

// 17. SWARM read (200mm orbit): 300 readers fan to 24 docs, converge on one writer at 1.2.
S('w-swarm', 'III', beats(4), 0, (ctx) => {
  const { scene, camera } = W.stage({ act: 'III' });
  const H = W.hall(scene, { state: 'lit', parts: { line: false, banks: false, foreman: false } });
  const Sw = W.swarmRead({ center: [20, 2, 0] }); scene.add(Sw.group);
  return { scene, camera, ...W.grade('III'), update(lt) {
    const t = T(ctx, lt);
    Sw.update(lt, { fan: clamp(lt / 0.8), converge: clamp((lt - 1.2) / 0.3), write: clamp((lt - 1.5) / 0.3), t });
    H.update(lt, { lit: 1 });
    const a = THREE.MathUtils.degToRad(-15 + 30 * lt / ctx.T);
    camFX(camera, t, W.camLook(camera, [20 + Math.sin(a) * 120, 30, Math.cos(a) * 120], [20, 3.5, 0], W.FOV[200]));
  } };
});

// 18. COLD OPEN cascade: 1,000 amber rails wake radially from CODE (top-down crane, fog x2).
S('w-cascade', 'COLD', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'COLD' });
  const H = W.hall(scene, { state: 'cold', parts: { rails: true, banks: false, foreman: false, pillars: false } });
  return { scene, camera, ...W.grade('COLD'), update(lt) {
    const t = T(ctx, lt);
    H.rails.update(lt, { cascade: lt * 0.6, t });
    H.line.update(lt, { lit: 0, strips: 0 });
    H.update(lt);
    camFX(camera, t, W.camColdCascade(camera, lt, { dur: ctx.T }));
  } };
});

// 19. COLD OPEN worm's-eye on the unexplained colossus + specular sweep.
S('w-foreman-worm', 'COLD', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'COLD' });
  const H = W.hall(scene, { state: 'dark', parts: { banks: false } });
  return { scene, camera, ...W.grade('COLD'), update(lt) {
    const t = T(ctx, lt);
    H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.4, sweep: { s: 40 + 140 * lt * 0.3, k: 12 } });
    H.update(lt, { sky: 4 });
    camFX(camera, t, W.camForemanWorm(camera, lt, { pull: 38 }));
  } };
});

// 20. The cursor macro + 21. DEPLOY maze top + 22. cold rail streak.
S('w-cursor', 'I', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'I' });
  const H = W.hall(scene, { state: 'dark', parts: { cursor: true, banks: false } });
  return { scene, camera, ...W.grade('I'), update(lt) {
    const t = T(ctx, lt);
    H.cursor.update(lt, { on: W.blink(t), k: 10, type: clamp(lt / 1.5), flare: 0.4 });
    H.update(lt);
    camFX(camera, t, W.camCursorMacro(camera, lt, { dur: ctx.T }));
  } };
});
S('w-deploy', 'II', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'II' });
  const H = W.hall(scene, { state: 'dark', parts: { banks: false } });
  const D = W.deployMaze({}); scene.add(D.group);
  return { scene, camera, ...W.grade('II'), update(lt) {
    const t = T(ctx, lt);
    D.update(lt, { cards: 240, lit: lt > 1 ? 1 : 0, t });
    H.update(lt);
    camFX(camera, t, W.camDeployTop(camera, lt));
  } };
});
S('w-cold-rail', 'COLD', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'COLD', fog: 0.02 });
  const H = W.hall(scene, { state: 'cold', parts: { banks: false, line: false, pillars: false } });
  const R = W.coldRail({}); scene.add(R.group);
  return { scene, camera, ...W.grade('COLD'), update(lt) {
    const t = T(ctx, lt * 0.25);
    R.update(lt * 0.25 + 0.15, {});
    H.extra.length = 0; H.extra.push({ p: R.orb.position.toArray(), c: W.C.clay, k: 6, pool: 2, poolK: 1, refl: 1.2, size: 0.5 });
    H.update(lt);
    camFX(camera, t, W.camColdRail(camera, lt * 0.25 + 0.15));
  } };
});

// 23. BOOKEND p-hall-mirror: the Act I master framing, now lit (banks, stations, rails flowing, pillars brass).
S('w-hall-lit', 'III', beats(4), 0, (ctx) => {
  const { scene, camera } = W.stage({ act: 'III' });
  const H = W.hall(scene, { state: 'lit', parts: { cursor: true, rails: true } });
  return { scene, camera, ...W.grade('III'), update(lt) {
    const t = T(ctx, lt);
    H.banks.update(lt, { on: 1, t });
    H.rails.update(lt, { cascade: 99, flow: 30, t, k: 4 });
    H.cursor.update(lt, { on: W.blink(t, { bpm: 150, div: 2 }) });
    H.foreman.update(lt, { lit: 5 });
    H.update(lt);
    camFX(camera, t, W.camHallWide(camera, lt, { dur: ctx.T }));
  } };
});
// 24. iii-still: the lit hall behind camera, the foreman a black stepped silhouette against warm haze.
S('w-still', 'III', beats(4), 0, (ctx) => {
  const { scene, camera } = W.stage({ act: 'III' });
  const H = W.hall(scene, { state: 'lit', parts: {} });
  return { scene, camera, ...W.grade('III', { exposure: 0.85 }), update(lt) {
    const t = T(ctx, lt);
    H.banks.update(lt, { on: 1, t });
    H.foreman.update(lt, { lit: 0, rimColor: W.C.amber, rimK: 0.3 });
    H.update(lt, { sky: 2.5 });
    camFX(camera, t, W.camStill(camera, lt, { dur: ctx.T }));
  } };
});

// 25. REVIEW side telephoto (camReviewSide R->L): stalled queue wall + the stamped world-space label.
S('w-review-side', 'II', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'II', fog: W.fogKeep(90, 0.75) });
  const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false, towers: { review: 1200 } } });
  const Q = W.cards({ count: 60 }); scene.add(Q.mesh);
  const lab = H.line.label(W.ST.REVIEW, 'REVIEW.', { color: W.C.red, k: 3, height: 1.4 });
  return { scene, camera, ...W.grade('II'), update(lt) {
    const t = T(ctx, lt);
    for (let i = 0; i < 60; i++) { const col = i % 6, row = Math.floor(i / 6); Q.set(i, { p: [-10.2 - col * 3.1, 1.45 + row * 0.52, 0], r: [0, 0, (i % 3 - 1) * 0.03], edge: W.CARD.edge(), body: W.CARD.body() }); }
    Q.commit();
    H.towers.update(lt, { review: 220, t });
    H.line.update(lt, { lit: 0, red: [0, 0, 0, 1, 0, 0, 0] });
    lab.visible = lt > 0.5;
    H.update(lt);
    camFX(camera, t, W.camReviewSide(camera, lt, { dur: ctx.T, dir: -1, t, handheld: 0.3 }));
  } };
});
// 26. the flat swarm pours in: 1,000 instanced ice agents + 8,000-particle haze, the dimmed clay spark lost among them.
S('w-swarm-pour', 'II', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'II', fog: W.fogKeep(95, 0.8) });
  const H = W.hall(scene, { state: 'dark', parts: { banks: false } });
  const A = W.agents({ count: 1000 }); scene.add(A.mesh);
  const Hz = W.swarmHaze({ count: 8000, spread: [150, 3, 50], center: [0, 2, 0], k: 1.2, size: 0.35 }); scene.add(Hz.points);
  const spark = W.agents({ count: 1, r: 0.45 }); scene.add(spark.mesh);
  const seeds = Array.from({ length: 1000 }, (_, i) => [Math.sin(i * 12.9898) * 43758.5453 % 1, Math.sin(i * 78.233) * 12543.31 % 1]);
  return { scene, camera, ...W.grade('II'), update(lt) {
    const t = T(ctx, lt);
    const n = Math.floor(10 * Math.pow(100, clamp(lt / 1.5)));
    for (let i = 0; i < 1000; i++) { if (i >= n) { A.hide(i); continue; } const [a, b] = seeds[i]; A.set(i, { p: [a * 70 + Math.sin(t * 1.3 + i) * 0.8, 1.5 + Math.abs(b) * 1.5, b * 22 + Math.cos(t + i) * 0.8], c: W.lin(W.C.ice), k: 2 }); }
    A.commit();
    spark.set(0, { p: [-19.6, 2, 1], c: W.lin(W.C.clay), k: 3 }); spark.commit();
    H.update(lt);
    camFX(camera, t, W.camTop(camera, 0, 90, 0, W.FOV[35], 4 * lt));
  } };
});
// 27. two writers, one card (camWriterMacro): ice orbs converge, the card cracks red.
S('w-writer', 'II', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'II' });
  const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false, pillars: false } });
  const card = W.cards({ count: 1 }); scene.add(card.mesh);
  const wr = W.agents({ count: 2, r: 0.12, seg: 16 }); scene.add(wr.mesh);
  const crack = W.fat([[-9, 2.86, 0.6], [-9.05, 2.86, 0.2], [-8.95, 2.86, -0.2], [-9, 2.86, -0.6]], { color: W.C.red, k: 6, width: 2 }); scene.add(crack);
  return { scene, camera, ...W.grade('II'), update(lt) {
    const t = T(ctx, lt);
    const u = clamp((lt - 0.15) / 0.3);
    wr.set(0, { p: [W.G.THREE.MathUtils.lerp(-11, -9.6, ease.out(u)), 2.95, 0.2], c: W.lin(W.C.ice), k: 4 });
    wr.set(1, { p: [W.G.THREE.MathUtils.lerp(-7, -8.4, ease.out(u)), 2.95, 0.2], c: W.lin(W.C.ice), k: 4 }); wr.commit();
    card.set(0, { p: [-9, 2.6, 0], edge: lt > 0.6 ? W.CARD.redEdge() : W.CARD.edge(), body: W.CARD.body() }); card.commit();
    crack.userData.reveal(clamp((lt - 0.6) / 0.15));
    H.update(lt);
    camFX(camera, t, W.camWriterMacro(camera));
  } };
});
// 28. cold-open FPV skim over the cascading rails (camColdFPV), lamp posts whipping past.
S('w-fpv', 'COLD', beats(4), 138, (ctx) => {
  const { scene, camera } = W.stage({ act: 'COLD' });
  const H = W.hall(scene, { state: 'cold', parts: { rails: true, banks: false, pillars: false } });
  return { scene, camera, ...W.grade('COLD'), update(lt) {
    const t = T(ctx, lt);
    H.rails.update(lt, { cascade: 99, flow: 30, t });
    H.update(lt);
    camFX(camera, t, W.camColdFPV(camera, lt * 0.25));
  } };
});
// 29. title forge (3D light line + embers) for t-title.
S('w-title', 'TITLE', beats(4), 0, (ctx) => {
  const { scene, camera } = W.stage({ act: 'TITLE', fog: 0 });
  const F = W.titleForge({}); scene.add(F.group);
  return { scene, camera, ...W.grade('TITLE'), update(lt) {
    const t = T(ctx, lt);
    F.update(lt, { grow: ease.expoOut(clamp(lt / 0.27)), split: lt > 0.3 ? 2.6 * ease.expoOut(clamp((lt - 0.3) / 0.5)) : 0, warm: clamp(lt / 0.6), t });
    camFX(camera, t, W.camTitle(camera, lt, { dur: ctx.T }));
  } };
});
