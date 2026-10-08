export const meta = {
  name: 'sf-fix',
  description: 'Apply aggregated critic findings per scene group, re-render and verify',
  phases: [{ title: 'Fix', detail: 'one fixer per scene group' }],
}

const ROOT = '/home/user/skills-introduction-to-github/software-factory-opus-5-5'
const groups = Array.isArray(args) ? args : [args]

phase('Fix')
const out = await parallel(groups.map((g) => () => agent(`You are polishing scenes of a calm, premium, no-voiceover executive-briefing video rendered from HTML/GSAP. Project root: ${ROOT}. Run commands from there.
Read ${ROOT}/docs/BUILDING.md first (contract, layout, pacing, determinism rules), then ${ROOT}/docs/sources.md and ${ROOT}/docs/verdict.md (fact-checked ground truth — on-screen claims must match them).

YOUR SCENES: ${g.files.join(', ')} (in ${ROOT}/src/scenes/). Edit ONLY these files. Shared libs (src/lib*.js, engine.js, chrome.js, styles.css) are owned by the lead and must not be edited — if a fix truly needs a lib change, do it locally inside your scene or report it.
Recent lead changes to shared libs you can rely on: lib-ladder rung tags/"when" labels are now 18px (offsets y-28 / y-54). Factory.build(svg, opts) now accepts { humanOff (default 190), beltPad (default 150), personScale (default 1), humanLabels: ['intent in','judgment out'] } — when humanLabels is given, each human group gets a ._label text element you must fade in/out with it (F.humanL._label, F.humanR._label). Each station object in F.st has an 'on' property (default 1) that scales its orbiting agent dots' opacity (tween it with tl.to(stationObj, {on: 0..1})).

FIRST read ${ROOT}/dist/review/findings/_lead.md — the lead's cross-scene decisions; they OVERRIDE individual findings where they conflict, and they set exact copy for several beats. THEN read your FINDINGS (from three independent critics: visual design, story/pacing, factual accuracy) in ${g.findingsFile}. Read it fully. Apply every blocker and major finding, and every minor one that is cheap and clearly right. When critics conflict, prefer: factual accuracy > legibility/safe-area > calm pacing > everything else. Keep the client's notes in mind: calm transitions with ~1 s of air, no rushed text (2 s + 0.3 s/word minimum hold), story that connects the dots.
TARGET DURATIONS (the whole film must land near 7:00): ${g.durations}. Retime internal beats to fit; keep music "hits" on the beats they belong to (update hits arrays if beats move).

Verify: render stills with  node render/stills.mjs --only <your files comma-separated> --out dist/stills/fix-${g.key} --every 1  and inspect them (build contact sheets with PIL). Fix everything you see. Also check console errors at the end of the stills output. Iterate until clean.
Return a concise report: what you changed per finding (one line each, note any finding you rejected and why), final durations, and anything the lead must change in shared files.`, { label: `fix:${g.key}`, phase: 'Fix' })
  .then((r) => ({ key: g.key, report: r }))))
return out
