# TRUST ME: Art direction ("Vinyl toy noir")

Reference images:
(Reference images were shared privately during the jam and are not included in this repo.)
- 1–2: reignoftitans.gg: chunky designer-vinyl-toy 3D characters, oversized heads, huge white eye plates
  with thick black outlines and expressive brows, glowing cyan accent lines, deep teal backgrounds.
- 3–4: Among Us map + crew: cut-away rooms read instantly; colour = identity.
- 5–6: Among Us VR tutorial/menus: diegetic hint boards, big simple menus.
- 7–8: Team Fortress 2 UI: chunky, characterful game UI; strong silhouettes.
- 9–11: mazerance.com: graphic-novel cast, bold red/black, halftone, ink outlines, a TV-head robot,
  a lineup of distinct silhouettes.

**Never copy any of these.** Take the principles and make something original and better.

## The look in one line
Premium designer-vinyl-toy robots living in a cosy cut-away dollhouse at night, framed by
bold graphic-novel UI. Cute first, with an undercurrent of unease.

## Characters (procedural 3D, built from primitives in React Three Fiber)
Each robot has a distinct **silhouette** (readable at 40px) plus a signature colour.
- **BOLT** (yellow #F5C518): boxy, slightly squat, lightning-bolt antenna, eager.
- **MOCHI** (pink #FF8FB8): round soft dumpling head, tiny arms, gentle.
- **ZIGGY** (green #4CC38A): tall capsule body, zigzag headphones, chill.
- **PIP** (blue #4A90E2): TV-screen head with rounded bezel, precise. Must NOT resemble Mazerance's TV robot:
  PIP's face is drawn on the screen, it has feet, and its bezel is chunky.
- **JUNO** (purple #9B6BFF): dome head with a floating halo ring, confident.
- Shared toy language: satin vinyl material (MeshStandard/Physical, roughness ~0.45, a hint of clearcoat),
  soft bevels (RoundedBox), stubby limbs, big white eye plates with thick dark outlines.
  A thin emissive accent seam in the signature colour.
- **Eyes do the acting**: expressions neutral, happy, worried, smug, angry, sleepy/off (drawn as
  shapes/scale/brow tilt). The cheater has **no tell** during play. At the reveal its seams go red and
  its eyes glitch.

## World
- An isometric cut-away single-storey house (walls cut at half height, no roof) floating in a deep
  teal-night void (#062A2E → #03181B). Warm interior light pools per room, cool rim light outside.
- Soft contact shadows. Rooms are clearly separated, with floor colour and materials per room.
- Furniture is simple, chunky and toy-like (rounded boxes), 2–4 props per room that say what the room is.
- Room labels are big, legible, always readable (UX rule: location matters).

## UI (2D over the 3D)
- Graphic-novel boldness: heavy condensed display type (**Anton** for titles, **Barlow Condensed**
  for UI labels, **Barlow** for body). All from Google Fonts.
- Palette: night teal surfaces, cream "paper" for evidence (case files), **signal red #FF3B3B** for
  danger/drama, **cyan #3EE6E0** as the "AI" glow, robot colours for identity.
- Ink outlines (2px dark stroke) on cards, slight rotation on evidence cards, halftone dot accents on
  dramatic surfaces. No generic dashboard look, no plain forms.
- Motion: springy, toy-like (Framer Motion springs). Big moments get choreography:
  alarm → red wash + halftone sweep + slammed "EMERGENCY MEETING" type; poll cards flip one by one;
  unplug = eyes power down + desaturate; self-preserve = glitch + freeze-frame; takeover = house lights
  go red, doors lock.

## UX rules (from the Among Us UX teardown)
1. Sound on every meaningful action.
2. Actions only light up when valid (right room, AP left), with a clear reason otherwise.
3. Robots visibly move between rooms. Where things happened is the player's memory game.
4. One click to play, no account, no tutorial wall: inline hints on Day 1 only.
5. Big targets, click outside a panel to close it.
6. Room names and "You are here" always obvious.
