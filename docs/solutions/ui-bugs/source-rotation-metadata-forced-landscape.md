---
title: "Phone video rendered landscape — source rotation=90 metadata ignored"
date: 2026-06-16
category: ui-bugs
module: video-pipeline
problem_type: ui_bug
component: tooling
symptoms:
  - "Final render came out landscape 1280x720 instead of portrait 720x1280"
  - "ffprobe stream=width,height reports 1280,720 (storage), but the clip displays portrait"
  - "ffprobe stream_side_data=rotation returns 90 on the source; pipeline outputs have no rotation flag"
  - "Person/content fit into the wrong aspect after smooth.py + Remotine render"
root_cause: config_error
resolution_type: code_fix
severity: high
tags:
  - "ffmpeg"
  - "ffprobe"
  - "video-rotation"
  - "autorotation"
  - "remotion"
  - "aspect-ratio"
  - "portrait-video"
  - "metadata-driven"
---

# Phone video rendered landscape — source rotation=90 metadata ignored

## Problem
A Google Pixel source video is stored as `1280x720` but carries a container `rotation=90` flag, so it *displays* as portrait `720x1280`. The CLI editing pipeline (ffmpeg `smooth.py` + Remotion) ignored the rotation and hardcoded landscape dimensions, so the final render came out horizontal — the user called it "la catastrophe".

## Symptoms
- Final render `media/output/onboard-claude-code-final.mp4` was landscape `1280x720` instead of the expected portrait `720x1280`.
- `ffprobe -select_streams v:0 -show_entries stream=width,height` reported `1280,720` — but that is the *storage* resolution, not the displayed one.
- `ffprobe -select_streams v:0 -show_entries stream_side_data=rotation -of csv=p=0 source.mp4` returned `90` (also visible as per-frame `SIDE_DATA rotation=90`).
- Every pipeline output was `1280x720` with **no** rotation flag — the rotation had been baked away as landscape.

## What Didn't Work
- **Trusting `stream=width,height` as the true orientation.** ffprobe's `width,height` is the storage resolution. With a `rotation=90` side_data flag, the displayed frame is the transpose. Reading stream dims alone gives the wrong (landscape) shape — that wrong value was copied into the EDL `resolution`.
- **Hardcoding output dimensions** in the EDL (`work/final-edit.json` → `"resolution": "1280x720"`), in `scripts/smooth.py`'s `zoompan s={W}x{H}`, and in Remotion (`graphics/src/Root.tsx` `width={1280} height={720}`, plus 720-width layout constants in `Programme.tsx`). Once literal landscape dims are in the filter graph and compositions, the portrait source is forced into a landscape canvas regardless of its metadata.
- **A manual `transpose` filter would be wrong here (double rotation).** ffmpeg already applies the source's `rotation=90` autorotation before the filter chain by default, so inside the graph the frame is already upright (`iw=720, ih=1280`). Adding `transpose=...` would rotate a second time and re-break orientation. The fix is to set the *target* dims to portrait, not to re-rotate.

## Solution
**1. Diagnose the real orientation** — probe the rotation side_data, not just the dims:

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream_side_data=rotation -of csv=p=0 source.mp4   # -> 90
```

Confirm ffmpeg autorotates upright before the filter chain (one-shot test yielding upright `720x1280`):

```bash
ffmpeg -ss 0 -to 5 -i source.mp4 \
  -vf "scale=2*iw:2*ih,zoompan=...:s=720x1280:fps=28.9167" out.mp4
# iw=720, ih=1280 inside the graph -> output is upright portrait
```

**2. EDL: set portrait resolution** (no `transpose` added):

```diff
- "resolution": "1280x720"
+ "resolution": "720x1280"
```

`smooth.py` derives `W=720, H=1280` from this and emits `zoompan ... s=720x1280` → portrait.

**3. Drive Remotion dimensions from data, not literals.** Add the dims to `timings.json`:

```json
{ "width": 720, "height": 1280, "fps": 30, "...": "..." }
```

`Root.tsx` reads them for both compositions instead of hardcoding:

```diff
- <Composition ... width={1280} height={720} />
+ <Composition ... width={timings.width} height={timings.height} />
```

`Programme.tsx` becomes responsive via `useVideoConfig()` instead of hardcoded 720 constants:

```tsx
const { width, height } = useVideoConfig();
```

**4. Re-run the pipeline** (smooth → LUT grade → Remotion renders → ffmpeg concat), all at `720x1280`; verify frames are upright + portrait. Committed as `ee72c46 "fix: respecter l'orientation portrait (source verticale rotation=90)"`.

## Why This Works
The root cause was two-fold: the source's `rotation=90` metadata was ignored (so the displayed portrait shape was never accounted for), and the resulting landscape dimensions were hardcoded into the EDL, the ffmpeg filter graph, and the Remotion compositions. ffmpeg already autorotates a rotated source upright before the filter chain, so the frames entering the graph are genuinely portrait (`iw=720, ih=1280`); the only thing left wrong was the target canvas size. Setting the target to `720x1280` — and sourcing that value from data everywhere downstream — makes every stage agree with what ffmpeg is actually feeding it, keeping the pipeline portrait end to end. No `transpose` is needed because rotation is handled once, automatically.

## Prevention
- **Probe rotation before setting pipeline resolution.** Run `ffprobe ... -show_entries stream_side_data=rotation`; if rotation is `90` or `270`, swap width/height to compute *display* dimensions before choosing the target resolution.
- **Never hardcode W/H.** Source dimensions from data (EDL `resolution`, `timings.json` width/height) and read them everywhere downstream — `smooth.py`'s `zoompan s=`, Remotion `Root.tsx`, and via `useVideoConfig()` in components — so one value drives the whole pipeline.
- **Add a post-render sanity check**: probe the output and assert dims equal the expected *display* dims (e.g. `720x1280`); fail loudly otherwise.
- **Remember: `width,height` from ffprobe is storage, not display.** For any phone/action-cam source, treat stream dims as suspect until the rotation side_data is checked.

## Related Issues
- Commit `ee72c46` — "fix: respecter l'orientation portrait (source verticale rotation=90)".
- First documented solution in this repo; no related docs yet.
