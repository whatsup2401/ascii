# Terminal Braille Physics Sandbox

A browser-based creative-coding toy that renders Matter.js physics bodies as Unicode Braille (default) or ASCII glyphs, wrapped in a CRT/phosphor terminal aesthetic.

## Run

```bash
npm i
npm run dev
npm run build
```

Open the local Vite URL in Chrome.

## Controls

### Mouse
- **Left click on body**: grab/drag via spring constraint; release to throw.
- **Left click in top 10% of scene**: spawn a larger ball at cursor.
- **Hold left click on empty space**: spawn stream (rain tool).
- **Right click** or **Alt + Left click**: repulsion burst at cursor.
- **Shift + Left drag**: draw static wall segment.
- **Mouse wheel**: adjust brush radius (burst + spawn ring).

### Keyboard
- **Space**: pause/unpause.
- **R**: reset scene.
- **B**: toggle Braille/ASCII render mode.
- **T**: toggle trails.
- **G**: cycle gravity presets (down, zero, up, diagonal).
- **Q / E**: quality down/up.
- **H**: toggle help overlay.
- **Enter**: focus command line.
- **Esc**: leave command line focus.

## Command line

Press **Enter** to focus and type commands:

- `:help`
- `:reset`
- `:spawn balls <n> [radius]`
- `:spawn boxes <n> [size]`
- `:gravity <x> <y>`
- `:quality <0..4>`
- `:mode braille|ascii`
- `:trails on|off`
- `:burst <strength>`
- `:save` (download JSON scene)
- `:load` (open JSON scene file picker)

## Quality settings

Quality levels `0..4` tune:
- glyph grid resolution
- max dynamic body budget
- stream spawn rate cap
- trail fade strength
- bloom intensity

Default is quality `2`.

### Auto-scaling
- If average FPS stays **below 50** for ~2s, quality steps down (unless user manually changed quality).
- If average FPS stays **above 58** for ~5s, quality steps up (unless manual override).

## Architecture overview

- `src/main.ts`
  - app bootstrap, RAF loop, fixed-step accumulator
  - input + command line + quality logic
  - compose render passes
- `src/physics.ts`
  - Matter.js engine setup, world boundaries, obstacles
  - spawning, burst impulse, static segment drawing
  - scene serialization/load
- `src/renderer/fieldBuffer.ts`
  - offscreen intensity rasterization (2x4 subpixels per glyph)
  - trails + spark injection
- `src/renderer/braille.ts`
  - Unicode Braille conversion with ordered dithering
  - includes dot-mapping sanity assertion
- `src/renderer/ascii.ts`
  - ASCII fallback density ramp conversion
- `src/renderer/post.ts`
  - bloom, scanlines, vignette, noise
- `src/ui/terminalChrome.ts`
  - top status bar, bottom command bar, help overlay
- `src/ui/commands.ts`
  - parse/execute all required commands
- `src/util/perf.ts`
  - FPS tracking + quality suggestion heuristic
- `src/util/palette.ts`
  - phosphor palette, quality presets, glyph ramp

## Save format

Versioned schema:

```json
{
  "version": 1,
  "settings": {
    "gravityX": 0,
    "gravityY": 1,
    "quality": 2,
    "mode": "braille",
    "trails": true,
    "burstStrength": 0.022
  },
  "bodies": [],
  "segments": []
}
```

## Known limitations

- Body rendering is intentionally monochrome for strong terminal legibility (no per-cell color quantization yet).
- Static wall drawing currently commits one segment per drag (polyline simplification could be expanded).
- Mouse-constraint tunneling is best-effort; extremely violent drags can still produce occasional clipping.

## Future improvements

- Optional chromatic aberration + per-cell color bands.
- Polyline segment drawing with decimation and edit/delete tools.
- Better touch support and gesture mapping.
- Preset scenes and replay timeline.
