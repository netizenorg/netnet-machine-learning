# Changelog

## 0.1.0 (unreleased)

First release.

- `nn.hands()`: hand tracking with Google's MediaPipe Hand Landmarker (`@mediapipe/tasks-vision` 1.0.1).
  - `detect(video, { mirror })` returns hands as arrays of 21 `{ x, y, z }` points in page pixels, lined up with the video as it's displayed (position, size, `object-fit`, mirroring), with a `side` property (`'left'` or `'right'`).
  - All MediaPipe options pass through; `results` and `raw` give access to MediaPipe's full output and object.
  - The MediaPipe library and models load only when first used.
  - Uses the GPU when available, falling back to the CPU.
  - Loads MediaPipe's engine with `fetch()` rather than letting MediaPipe add a `<script>` tag to the page, which silently failed in Firefox inside netnet.studio's preview. Falls back to MediaPipe's usual loading if that isn't possible.
- MediaPipe's usage logger is disabled in the included copy (see `src/mediapipe/README.md`).
- Examples: `hands-hello.html`, `hands-draw.html`.
- Docs: `docs/hands.md`.
