export const meta = {
  name: 'sf-review',
  description: 'Multi-lens critique of the rendered briefing (visual, story/pacing, facts) over contact sheets',
  phases: [{ title: 'Critique', detail: 'lens × chapter-group critics' }],
}

const ROOT = '/home/user/skills-introduction-to-github/software-factory-opus-5-5'
const LENSES = {
  visual: `LENS: VISUAL DESIGN & LEGIBILITY. You are a senior motion designer reviewing a premium keynote-style briefing video. Look at every still. Flag: overlapping or clipped text, elements outside the safe area (x 160–1760, y 150–960; the top-left chapter label, top-right source line and bottom "thread" band are reserved), text too small to read on a 1080p screen, weak hierarchy, cluttered or unbalanced composition, inconsistent styling vs the other scenes, awkward empty frames, things that look broken or unfinished, colors that clash with the palette. Be concrete: name the scene id, the timestamp (from the filename), what is wrong, and the exact fix (coordinates/sizes/timing).`,
  story: `LENS: STORY, PACING & CONNECTING THE DOTS. The client's explicit notes: transitions must be calm (about 1 s of air, nothing rushed), the video must feel like a story that keeps connecting dots, and it must work as an executive briefing (bottom line first, then evidence). Read docs/storyboard.md and the scene source files, then look at the stills in time order. Flag: text that leaves before it can be read (rule: 2 s + 0.3 s/word), scenes that start/end abruptly, missing bridge lines between chapters, ideas that are repeated, jargon an exec would trip on, places where the thread of the argument breaks, and moments that feel like a slide dump rather than a story. Give exact fixes (timing changes in seconds, copy edits).`,
  facts: `LENS: FACTUAL ACCURACY & FAIRNESS. Read docs/sources.md and docs/verdict.md (the fact-checked ground truth). Compare EVERY number, date, quote and attribution visible in the stills and in the scene source files against them. Flag any mismatch, overclaim, missing caveat, missing source line, or wording stronger than the evidence (e.g. calling a vendor-reported number independent, implying causation, "#1" without qualifier). Also flag anything that could embarrass the presenter in front of a technically sharp manager. Give the exact corrected copy.`,
}
const GROUPS = {
  open: { scenes: ['title', 'bluf', 'ladder', 'evidence', 'bridge'], note: 'Opening + Chapter 01 (the last wave)' },
  middle: { scenes: ['history', 'factory-line', 'arch', 'synthesis', 'interfaces'], note: 'Chapters 02–04 (factory, architecture, interfaces)' },
  close: { scenes: ['computer-use', 'opus55', 'ladder2', 'moves', 'close'], note: 'Chapters 04–06 (computer use, the model, the next wave, close)' },
}
const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          scene: { type: 'string' },
          time: { type: 'string', description: 'local or global timestamp, e.g. t0123.00' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          issue: { type: 'string' },
          fix: { type: 'string', description: 'exact, implementable fix' },
        },
        required: ['scene', 'severity', 'issue', 'fix'],
      },
    },
    overall: { type: 'string', description: '2-3 sentence overall assessment of this group under this lens' },
  },
  required: ['findings', 'overall'],
}

const jobs = []
const lensKeys = Array.isArray(args) && args.length ? args : Object.keys(LENSES)
for (const lk of lensKeys) for (const [gk, g] of Object.entries(GROUPS)) jobs.push({ lk, lens: LENSES[lk], gk, g })
phase('Critique')
const out = await parallel(jobs.map(j => () => agent(`${j.lens}

Project root: ${ROOT}. You are reviewing ${j.g.note}: scene ids ${j.g.scenes.join(', ')}.
Stills for each scene are in ${ROOT}/dist/review/<scene-id>/ (one PNG per second, filenames are global timestamps; a contact sheet sheet.png per scene is there too). Scene sources are in ${ROOT}/src/scenes/. The cue sheet with global start times is ${ROOT}/dist/review/cues.json.
Open the contact sheets first, then individual stills where you need detail. Do not edit any files. Report only real problems worth fixing (no praise), most severe first. Note: the full video currently runs 7:08 and the client's ceiling is 7:00 — under the story/pacing lens, also suggest where 2–4 s can be trimmed without hurting reading time.`, { label: `review:${j.lk}:${j.gk}`, phase: 'Critique', schema: FINDINGS })
  .then(r => r && ({ lens: j.lk, group: j.gk, ...r }))))
return out.filter(Boolean)
