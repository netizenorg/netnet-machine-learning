# MediaPipe (Google)

The files in this folder are Google's MediaPipe Tasks library for the web, redistributed under the Apache License 2.0 (see `LICENSE` in this folder). They are **not** covered by this repository's GPL-3.0 license. (For why this library includes these files rather than loading them from Google, see the [main README](../../README.md#why-everything-is-included-in-src).)

- **Source:** the npm package [`@mediapipe/tasks-vision`](https://www.npmjs.com/package/@mediapipe/tasks-vision), version **1.0.1**
- **Project:** https://github.com/google-ai-edge/mediapipe
- **Docs:** https://developers.google.com/edge/mediapipe/solutions/guide

## Files

- `vision_bundle.mjs`: the MediaPipe vision library (JavaScript). **Modified**, see below.
- `wasm/vision_wasm_internal.js` and `wasm/vision_wasm_internal.wasm`: the WebAssembly engine that runs the models. Unmodified.

The package's non-SIMD fallback engine (`vision_wasm_nosimd_internal.*`) and module variant (`vision_wasm_module_internal.*`) are not included. All current major browsers support WebAssembly SIMD.

## What we changed

`vision_bundle.mjs` includes a logger that sends usage statistics (which task is running, its running mode, and timing counts) to `https://odml.pa.googleapis.com/v1/log` about once a minute, starting whenever a model is created. In order to ensure that this library (netnet-machine-learning) conforms to the netnet.studio privacy policy, we've disabled the logger in our version of `vision_bundle.mjs`: it is marked as already failed when it's created, so it never schedules or sends anything.

The change is a single line, marked with `LOCAL EDIT` (search the file for it), with an explanation at the top of the file. Nothing else was changed. The models always run on your own computer either way; this change means that after the files load, nothing contacts Google.

## Updating

When updating to a newer version of `@mediapipe/tasks-vision`:

1. Replace `vision_bundle.mjs` and the `wasm/` files with the new version's.
2. Re-apply the `LOCAL EDIT` (search the new bundle for `odml.pa.googleapis.com` to find the logger).
3. Search the new bundle for `http` to check that no other network calls were added.
4. Test every example, and update the version number in this file.
