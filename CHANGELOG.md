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
- `nn.prompt()` (`src/nn-prompt.js`): sends prompts to language models, and requests to other AI models' web APIs.
  - Providers: Gemini (`generateContent`), OpenAI (Chat Completions), Anthropic (Messages), Ollama (`/api/chat`), and `generic` (the common format, originally OpenAI's, that many local servers use; needs a `url`), all stateless, with one simple `{ role, content }` message format translated for each (roles are `'user'` and `'model'`; `'assistant'` is accepted too).
  - `schema` asks for JSON replies in each provider's format; the parsed result is in `reply.data`.
  - `url` sends a provider's format to another address (for example, Ollama on another computer); leaving out `provider` sends a request to any endpoint.
  - Any property that isn't one of `nn.prompt()`'s own options is added to the request (so no nested objects are needed); `body` holds properties whose names clash with those options.
  - The method is automatic (`POST` when there's data, `GET` when there isn't); with `GET`, data goes in the URL as query parameters.
  - `reply.request` shows exactly what was sent (with the key hidden) and `reply.raw` the full response.
- Examples: `hands-hello.html`, `hands-draw.html`, `prompt-simple.html`, `prompt-chat.html`, `prompt-explode.html`.
- Docs: `docs/hands.md`, `docs/prompt.md`.
