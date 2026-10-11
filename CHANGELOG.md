# Changelog

## 0.1.0 (unreleased)

First release.

- `nn.hands()`: hand tracking with Google's MediaPipe Hand Landmarker (`@mediapipe/tasks-vision` 1.0.1).
  - `detect(video, { mirror })` returns hands as arrays of 21 `{ x, y, z }` points in page pixels, lined up with the video as it's displayed (position, size, `object-fit`, mirroring), with a `side` property (`'left'` or `'right'`).
  - All MediaPipe options pass through; `results` and `raw` give access to MediaPipe's full output and object.
  - The MediaPipe library and models load only when first used.
  - Uses the GPU when available, falling back to the CPU.
  - Downloads MediaPipe's engine (`.js` and `.wasm`) and the model with its own `fetch()` and hands them to MediaPipe as data, rather than letting MediaPipe load them (its `<script>` tag and downloads silently stalled in netnet.studio's preview). The model downloads in parallel with the engine. Falls back to MediaPipe's usual engine loading if running downloaded code isn't allowed.
  - Warns in the console if a download or startup takes more than 15 seconds; `debug: true` logs every loading step with timings.
- `nn.face()`: face tracking with MediaPipe Face Landmarker: 478 points per face; with `outputFaceBlendshapes: true`, each face also has a `blendshapes` object of named expression scores (such as `jawOpen`).
- `nn.pose()`: body tracking with MediaPipe Pose Landmarker (lite): 33 points per body, each with a `visibility` value.
- MediaPipe's usage logger is disabled in the included copy (see `src/mediapipe/README.md`).
- `nn.prompt()` (`src/nn-prompt.js`): sends prompts to language models, and requests to other AI models' web APIs.
  - Providers: Gemini (`generateContent`), OpenAI (Chat Completions), Anthropic (Messages), Ollama (`/api/chat`), and `generic` (the common format, originally OpenAI's, that many local servers use; needs a `url`), all stateless, with one simple `{ role, content }` message format translated for each (roles are `'user'` and `'model'`; `'assistant'` is accepted too).
  - `schema` asks for JSON replies in each provider's format; the parsed result is in `reply.data`.
  - `url` sends a provider's format to another address (for example, Ollama on another computer); leaving out `provider` sends a request to any endpoint.
  - Any property that isn't one of `nn.prompt()`'s own options is added to the request (so no nested objects are needed); `body` holds properties whose names clash with those options.
  - The method is automatic (`POST` when there's data, `GET` when there isn't); with `GET`, data goes in the URL as query parameters.
  - `reply.request` shows exactly what was sent (with the key hidden) and `reply.raw` the full response.
- Examples: `hands-hello.html`, `hands-draw.html`, `face-hello.html`, `pose-hello.html`, `prompt-simple.html`, `prompt-chat.html`, `prompt-explode.html`.
- Docs: `docs/hands.md`, `docs/face.md`, `docs/pose.md`, `docs/prompt.md`, and notes on each model in `src/models/`.
