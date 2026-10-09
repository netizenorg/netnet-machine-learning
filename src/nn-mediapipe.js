/*
  nn-mediapipe.js
  ---------------
  Part of netnet-machine-learning: https://github.com/netizenorg/netnet-machine-learning
  An extension for nn (the netnet standard library) that adds Google's
  MediaPipe hand tracking model (face and body tracking coming soon).

    const hands = await nn.hands()            // load the model
    const found = hands.detect(video)         // run it on the video's current frame

  Load it with a plain <script> tag AFTER nn.min.js. The heavy files only
  download the first time you call nn.hands().

  These files are found relative to THIS file (not your page), so this folder
  can live anywhere (or on a CDN) as long as it keeps this layout:

    nn-mediapipe.js
    mediapipe/vision_bundle.mjs   <- code: the MediaPipe library (usage logging disabled, see that file)
    mediapipe/wasm/               <- code: the WebAssembly engine that runs the models
    models/*.task                 <- models: the trained weights (each .task file is a zip, try unzipping one!)
*/
(function () {
  'use strict'

  // where this file lives, so we can find the files next to it
  // (this has to be read right away, it isn't available later)
  const BASE = document.currentScript ? document.currentScript.src : null

  if (!window.nn) {
    console.error('( ◕ ◞ ◕ ) nn-mediapipe: load nn.min.js before this file')
    return
  }

  // the models this extension knows about
  const MODELS = {
    hands: { task: 'HandLandmarker', file: 'models/hand_landmarker.task', points: 'landmarks' }
    // coming soon (written but not yet tested or added to models/):
    // face: { task: 'FaceLandmarker', file: 'models/face_landmarker.task', points: 'faceLandmarks' },
    // pose: { task: 'PoseLandmarker', file: 'models/pose_landmarker_lite.task', points: 'landmarks' }
  }

  // MediaPipe's library + WebAssembly engine are shared by every model,
  // so we only load them once (per folder)
  const engines = {}
  function loadEngine (base) {
    if (!engines[base]) {
      engines[base] = (async () => {
        const lib = await import(new URL('mediapipe/vision_bundle.mjs', base).href)
        const wasm = new URL('mediapipe/wasm', base).href
        const fileset = await lib.FilesetResolver.forVisionTasks(wasm)
        return { lib, fileset }
      })()
    }
    return engines[base]
  }

  // MediaPipe gives us points from 0 to 1 (relative to the video's image),
  // this converts them to page pixels, lined up with the video element as it
  // appears on screen (its size, position, object-fit and mirroring)
  function pageMapper (video, mirror) {
    const box = video.getBoundingClientRect()
    const vw = video.videoWidth || box.width
    const vh = video.videoHeight || box.height
    const fit = window.getComputedStyle(video).objectFit
    let w = box.width
    let h = box.height
    if (fit === 'cover' || fit === 'contain') {
      const pick = fit === 'cover' ? Math.max : Math.min
      const scale = pick(box.width / vw, box.height / vh)
      w = vw * scale
      h = vh * scale
    }
    const left = box.left + (box.width - w) / 2
    const top = box.top + (box.height - h) / 2
    return (p) => ({
      x: left + (mirror ? 1 - p.x : p.x) * w,
      y: top + p.y * h,
      z: p.z
    })
  }

  class Tracker {
    constructor (landmarker, points) {
      this.raw = landmarker // the MediaPipe object itself, for anything this doesn't cover
      this.results = null // MediaPipe's full results for the latest frame (0 to 1 values, plus extras)
      this._points = points
      this._lastTime = -1
    }

    // runs the model on the video's current frame and returns what it found:
    // an array with one entry per hand (or face, or body), each an array of
    // { x, y, z } points in page pixels. pass { mirror: true } if your video
    // is displayed mirrored (like a selfie camera)
    // hands also have a .side property: 'left' or 'right'
    detect (video, opts = {}) {
      // only run the model when the camera has a new frame for us
      if (video.readyState >= 2 && video.currentTime !== this._lastTime) {
        this._lastTime = video.currentTime
        this.results = this.raw.detectForVideo(video, window.performance.now())
      }
      if (!this.results) return []
      const toPage = pageMapper(video, opts.mirror)
      return this.results[this._points].map((points, i) => {
        const found = points.map(toPage)
        // which hand it is, from the person's point of view ('left' or 'right')
        const label = this.results.handedness?.[i]?.[0]?.categoryName
        if (label) found.side = label.toLowerCase()
        return found
      })
    }
  }

  // loads a model, ex: await load('hands', { numHands: 2 })
  // any MediaPipe option can be passed, plus:
  //   assets: path to this folder (only needed if loading this file as a module)
  //   model: path to a different .task model file
  async function load (type, opts = {}) {
    const { assets, model, ...options } = opts
    const base = assets
      ? new URL(assets.endsWith('/') ? assets : assets + '/', document.baseURI).href
      : BASE
    if (!base) {
      throw new Error('( ◕ ◞ ◕ ) nn-mediapipe: I can\'t tell where my files are, pass the folder\'s path as { assets: \'path/to/nn-ai/\' }')
    }

    const { lib, fileset } = await loadEngine(base)
    const info = MODELS[type]
    const settings = {
      runningMode: 'VIDEO',
      ...options,
      baseOptions: {
        modelAssetPath: model
          ? new URL(model, document.baseURI).href
          : new URL(info.file, base).href,
        delegate: 'GPU', // run on the graphics card when possible
        ...options.baseOptions
      }
    }

    let landmarker
    try {
      landmarker = await lib[info.task].createFromOptions(fileset, settings)
    } catch (err) {
      if (settings.baseOptions.delegate !== 'GPU') throw err
      console.warn('( ◕ ◞ ◕ ) nn-mediapipe: couldn\'t use the GPU, using the CPU instead')
      settings.baseOptions.delegate = 'CPU'
      landmarker = await lib[info.task].createFromOptions(fileset, settings)
    }
    return new Tracker(landmarker, info.points)
  }

  // add nn.hands() (and later nn.face() and nn.pose())
  for (const type in MODELS) {
    if (window.nn[type]) console.warn(`( ◕ ◞ ◕ ) nn-mediapipe: nn.${type} already exists, replacing it`)
    window.nn[type] = (opts) => load(type, opts)
  }
})()
