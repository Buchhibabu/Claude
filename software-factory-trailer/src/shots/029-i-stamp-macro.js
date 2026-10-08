// 29 · i-stamp-macro — 85mm macro, dead centre on the CODE deck: one clay orb drops onto a work card and STAMPS it — squash,
// white-hot contact spark, the card's edge flares green for 3 frames — and the card is fired out right on a light streak while the
// next card slides in from the left. Background: the tower's lattice as out-of-focus clay bokeh, breathing on 8ths.
import { shot, beats, camFX } from '../engine.js';
import { W, THREE, T, gradeI, bokeh, ease, clamp, lerp, rand } from './lib/b3.js';

const CX = -19.6, TOP = 3.0;                 // deck top
const CW = 1.05, CH = 0.11, CD = 0.62;       // macro card
const OR = 0.13;                             // macro orb

shot({
  id: 'i-stamp-macro', dur: beats(1), act: 'I',
  music: { section: 'act1', chord: 'C', div: 16, energy: 0.76, add: [], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'tick', { gain: -4 });
    const { scene, camera } = W.stage({ act: 'I', fog: 0.02 });
    // the deck: dark glossy slab with a clay hairline along its front lip
    const deck = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 3.2), new THREE.MeshStandardMaterial({ color: 0x0b0b0c, metalness: 0.6, roughness: 0.45 }));
    deck.position.set(CX, TOP - 0.2, 0.6); scene.add(deck);
    const lip = W.fat([[CX - 7, TOP + 0.003, 2.2], [CX + 7, TOP + 0.003, 2.2]], { color: W.C.clay, k: 1.6, width: 1.4 }); scene.add(lip);
    const lanes = W.glowSegs([[[CX - 7, TOP + 0.002, 0.2], [CX + 7, TOP + 0.002, 0.2]], [[CX - 7, TOP + 0.002, 1.6], [CX + 7, TOP + 0.002, 1.6]]], { color: W.C.steel, k: 0.6, width: 1 }); scene.add(lanes);
    // cards: [0] the stamped one, [1] the next one
    const Cd = W.boxes({ count: 2, size: [CW, CH, CD], color: W.C.card, metal: 0.1, rough: 0.5, edgeW: 1.6, crowd: 0.4 }); scene.add(Cd.mesh);
    // the orb + contact light
    const orb = W.glowMesh(new THREE.SphereGeometry(OR, 28, 18), W.C.clay, 10, { radius: OR }); scene.add(orb);
    const orbL = new THREE.PointLight(W.C.clay, 0, 4, 1.5); scene.add(orbL);
    const spark = W.flare({ color: W.C.ivory, k: 0, size: 0.35 }); spark.position.set(CX, TOP + CH + 0.01, 1.0); scene.add(spark);
    const greenL = new THREE.PointLight(W.C.green, 0, 3, 1.5); greenL.position.set(CX, TOP + 0.3, 1.6); scene.add(greenL);
    // sparks off the contact
    const NS = 90, sp = W.G.particles({ count: NS, spread: [0, 0, 0], color: W.C.amber, size: 0.012, seed: 291 });
    sp.points.frustumCulled = false; scene.add(sp.points);
    const r = rand(2902); const sdir = Array.from({ length: NS }, () => { const a = r() * Math.PI; return [Math.cos(a) * (1 + 3 * r()), 0.4 + 2.2 * r(), (r() - 0.3) * 1.2]; });
    // speed streak behind the departing card
    const streak = W.fat([[0, 0, 0], [1, 0, 0]], { color: W.C.green, k: 0, width: 2.4 }); scene.add(streak);
    // the tower lattice behind, out of focus
    const rb = rand(2903); const pts = [];
    for (let i = 0; i < 46; i++) pts.push([CX + (rb() - 0.5) * 7, TOP + 0.05 + rb() * 1.6, -2.5 - rb() * 7, 0.18 + rb() * 0.42]);
    const BK = bokeh({ pts, color: W.C.clay, k: 0.55, seed: 29 }); scene.add(BK.group);
    const BK2 = bokeh({ pts: Array.from({ length: 10 }, () => [CX + (rb() - 0.5) * 6, TOP + 0.9 + rb() * 1.2, -1.2 - rb() * 1.5, 0.5 + rb() * 0.5]), color: W.C.ember, k: 0.22, seed: 30 });
    scene.add(BK2.group);
    const back = new THREE.PointLight(W.C.clay, 6, 14, 1.4); back.position.set(CX, TOP + 1.5, -3); scene.add(back);
    const TC = 0.04;                                         // contact
    return {
      scene, camera, ...gradeI({ bloom: { strength: 0.95, radius: 0.5, threshold: 0.8 } }),
      update(lt) {
        const t = T(ctx, lt);
        const dc = lt - TC;
        // orb: falls in from above frame, squashes on contact, rebounds out
        let oy, sq = 1;
        if (dc < 0) oy = lerp(TOP + CH + 0.75, TOP + CH + OR, ease.in(clamp(lt / TC)));
        else if (dc < 0.06) { oy = TOP + CH + OR * 0.78; sq = 0.78; }
        else oy = TOP + CH + OR * 0.78 + 5.5 * Math.pow(dc - 0.06, 1.6);
        if (dc >= 0.06 && dc < 0.12) sq = lerp(0.78, 1.08, (dc - 0.06) / 0.06); else if (dc >= 0.12) sq = 1;
        orb.position.set(CX, oy, 1.0); orb.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
        orb.userData.setGlow(dc >= 0 && dc < 0.1 ? 12 : 9);
        orb.visible = oy < TOP + 2;
        orbL.position.set(CX, oy, 1.25); orbL.intensity = orb.visible ? 0.4 + (dc >= 0 ? 2 * Math.exp(-dc / 0.08) : 0) : 0;
        spark.userData.set(dc >= 0 ? 6 * Math.exp(-dc / 0.04) : 0);
        // card 0: pressed, flares green 3 f, then fired out right (accelerating)
        const g = dc >= 0 && dc < 0.1 ? 1 : dc >= 0.1 ? Math.exp(-(dc - 0.1) / 0.07) : 0;
        const press = dc >= 0 && dc < 0.08 ? -0.012 * Math.sin(Math.PI * dc / 0.08) : 0;
        const dx = dc > 0.12 ? 14 * Math.pow(dc - 0.12, 2) + 1.2 * (dc - 0.12) : 0;
        const edge0 = W.CARD.edge(1.6).map((v, k) => lerp(v, W.CARD.greenEdge(4)[k], g));
        const body0 = W.CARD.body(0.6).map((v, k) => v + W.lin(W.C.green, 0.05)[k] * g);
        Cd.set(0, { p: [CX + dx, TOP + CH / 2 + press, 1.0], edge: edge0, body: body0 });
        // card 1: slides in from the left behind it (the conveyor never stops)
        const d1 = clamp((lt - 0.2) / 0.3);
        Cd.set(1, { p: [CX - 2.6 * (1 - ease.out(d1)), TOP + CH / 2, 1.0], edge: W.CARD.edge(1.2), body: W.CARD.body(0.5) });
        Cd.commit();
        greenL.intensity = 1.2 * g; greenL.position.x = CX + dx;
        // streak trailing the fired card
        if (dx > 0.05) { streak.geometry.setPositions([CX + dx - CW / 2 - Math.min(2.5, dx * 1.4), TOP + CH / 2, 1.0 + CD / 2, CX + dx - CW / 2, TOP + CH / 2, 1.0 + CD / 2]); streak.userData.set(3 * Math.min(1, dx) * clamp(1 - (dx - 0.8) / 0.7)); streak.visible = true; } else streak.visible = false;
        // sparks
        for (let i = 0; i < NS; i++) {
          const s = Math.max(0, dc), d = sdir[i];
          sp.positions[i * 3] = CX + d[0] * s * (i % 2 ? 1 : -1); sp.positions[i * 3 + 1] = TOP + CH + d[1] * s - 6 * s * s; sp.positions[i * 3 + 2] = 1.0 + d[2] * s;
        }
        sp.geometry.attributes.position.needsUpdate = true; sp.points.visible = dc >= 0 && dc < 0.4;
        sp.material.color.set(W.C.amber).multiplyScalar(W.ko(8) * Math.max(0, 1 - dc / 0.4));
        BK.update(t, { k: 0.55 + 0.25 * (dc >= 0 ? Math.exp(-dc / 0.1) : 0), pulse: 0.3 });
        BK2.update(t, { k: 0.22, pulse: 0.2 });
        // 85mm macro, centred; a 2% push and the stamp's jolt
        const push = 1 - 0.03 * ease.out(clamp(lt / ctx.T));
        const jolt = dc >= 0 ? -0.006 * Math.exp(-dc / 0.05) * Math.cos(dc * 90) : 0;
        const tg = [CX, 3.1 + jolt, 1];
        const pos = [CX, tg[1] + 0.3 * push, tg[2] + 4 * push];
        camFX(camera, t, W.camLook(camera, pos, tg, W.FOV[85]));
      },
    };
  },
});
