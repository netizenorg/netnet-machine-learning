# Contributing

## Principles

### What belongs here

- **Hide plumbing, not ideas.** For every helper, ask: *does it hide a hassle, or does it hide an idea?* Hide setup, file paths and format conversions. Keep what people should learn visible: the points a model returns, its scores, the step-by-step loop of a generative model, the training data.
- **Never limit people.** Sensible defaults, but every option passes straight through to the underlying library, and the raw output and objects are always reachable (`.results`, `.raw`).
- **People own their data.** Training examples and other inputs are plain arrays people can see, edit, save and share, not data hidden inside objects.
- **Privacy.** Nothing contacts outside servers after the files load (except `nn.prompt()`, and only when called; see below). Check every third-party library for network requests, remove any telemetry, and document the change.
- **Credit and transparency.** Each folder in `src` has a README saying where its files came from, their license, and what we changed. Each model has a notes file in `src/models/` that follows the template in that folder's README.
- **Readable source.** Short, commented, unminified. The source is part of the lesson.
- **Local first.** Every model a module uses (code, engine, weights) lives in `src` and works offline; a CDN is a convenience, never a requirement. The one exception is `nn.prompt()`, a small helper for talking to language models (and other AI models) over the web. It only contacts a server when your code calls it, and only the one you choose: a model on your own computer (like Ollama) or a company's API, with your own key. Don't add other modules that depend on outside servers.

### API patterns

`src/nn-mediapipe.js` is the reference implementation for modules with models (`src/nn-prompt.js` is the simpler pattern for a module with no files to load).

- **One plain script per extension** (`src/nn-<name>.js`), loaded with a `<script>` tag after `nn.min.js`. Student code stays in plain scripts too, never `type="module"`.
- **Add functions to `window.nn`; never modify `nn` itself.** Check that `nn` loaded first, warn before replacing an existing `nn.*` name, and write errors in `nn`'s style: `( ◕ ◞ ◕ ) nn-<name>: ...`
- **No top-level globals.** Wrap everything in a function, use strict mode, and always write `window.nn`, so the same file can also be loaded with `import`.
- **Load lazily.** Heavy libraries load with `import()` and models download only when their function is first called. Share engines between models.
- **Resolve every path from the extension's own URL** (`document.currentScript.src`, read when the script first runs), never from the page, so the same `src` folder works locally and from a CDN. Accept an `assets` option as the fallback.
- **Download big files yourself.** Don't let libraries add `<script>` tags or fetch their own files: inside netnet.studio's preview, those silently stalled. Use your own `fetch()`, hand the library the data, and warn in the console if a download is slow (see `download()` and `loadEngine()` in `nn-mediapipe.js`).
- **Loading is async; using is simple:** `const thing = await nn.thing(options)`, then plain methods like `thing.detect(video)`, returning plain data (arrays of `{ x, y, z }` in page pixels, so they work like `nn.pointer`).
- **Folder layout:** `src/nn-<name>.js`, the library in `src/<library>/` (with its LICENSE and a README), and weights in `src/models/` (with a notes file per model).

## Working with AI

The original version of `nn` itself was written by hand. This extension library was built largely in collaboration with an AI assistant (Claude, by Anthropic). We're open about that, and here's what that collaboration looks like:

- **People decide.** Scope, API design and values are human decisions. AI can suggest and push back, but doesn't decide.
- **Verify, don't trust.** Facts about models, licenses, versions and browser behavior come from primary sources (model cards, the actual shipped files, real tests), not from an AI's memory. Cite sources in the docs.
- **People test and commit.** Every change is reviewed and tested by a person in real browsers before it's committed. AI agents don't commit, tag or push.
- **Audit AI-written code like third-party code.** Check for network requests, unnecessary complexity and anything that breaks the principles above.
- **Say what's uncertain.** Good AI contributions separate what was verified from what was assumed.

**If you're an AI agent working on this repo:** read this whole file first, follow the API patterns using `src/nn-mediapipe.js` as the model, keep source readable, add no network requests (outside `nn.prompt()`), don't commit, and finish by listing what you changed, what you verified, and what still needs a human to test.

## Testing and releasing

**Develop locally:** serve the repo and open `examples/` (they load nn extensions locally, like `../src/nn-mediapipe.js`).

**Test on the CDN without a tag:**
1. Push, then get the hash: `git rev-parse HEAD`
2. Use commit hash URLs to test, for example: `https://cdn.jsdelivr.net/gh/netizenorg/netnet-machine-learning@<hash>/src/nn-mediapipe.js`
3. **Warm the cache first:** open the big files in a browser tab and let them download (`.../@<hash>/src/mediapipe/wasm/vision_wasm_internal.wasm` and `.../@<hash>/src/models/*.task`). If a fresh commit still fails, reload once before debugging.

**Checklist:** Chrome and Firefox, standalone and inside netnet.studio:
- [ ] every example works
- [ ] no console errors, and no "loading the engine the usual way" warning
- [ ] no requests to `googleapis` (or other 3rd parties), even after 2+ minutes

**Release:**
1. In `CHANGELOG.md`, rename `## Unreleased` to the version and date (bug fixes: `0.1.0` → `0.1.1`; new features: `0.1.1` → `0.2.0`).
2. Update the `@x.y.z` in the README's and docs' CDN URLs.
3. Commit, push, then tag (no `v` prefix): `git tag 0.2.0` and `git push origin 0.2.0`
4. Warm the cache and run the checklist again with the `@0.2.0` URL.
5. Add a new `## Unreleased` heading to `CHANGELOG.md`.

**Rules:** never move or reuse a tag (jsDelivr caches tags forever; release a new version instead). Always use exact versions in docs, never ranges like `@0.1`, which can mix files from different versions.

**Updating MediaPipe:** see [src/mediapipe/README.md](src/mediapipe/README.md#updating).
