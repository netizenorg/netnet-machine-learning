/*
  nn-mediapipe.js
  ---------------
  Part of netnet-machine-learning: https://github.com/netizenorg/netnet-machine-learning
  An extension for nn (the netnet standard library) that adds Google's
  MediaPipe hand, face and body (pose) tracking models.

    const hands = await nn.hands()            // load the model (or nn.face(), nn.pose())
    const found = hands.detect(video)         // run it on the video's current frame

  Load it with a plain <script> tag AFTER nn.min.js. The heavy files only
  download the first time you call nn.hands(), nn.face() or nn.pose().

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
    hands: { task: 'HandLandmarker', file: 'models/hand_landmarker.task', points: 'landmarks' },
    face: { task: 'FaceLandmarker', file: 'models/face_landmarker.task', points: 'faceLandmarks' },
    pose: { task: 'PoseLandmarker', file: 'models/pose_landmarker_lite.task', points: 'landmarks', visibility: true }
  }

  const secs = (start) => ((window.performance.now() - start) / 1000).toFixed(1)

  // warns in the console if something takes a long time, so a stalled
  // download doesn't just fail silently. returns a function to cancel it
  function warnIfSlow (what) {
    const timer = setTimeout(() => {
      console.warn(`( ◕ ◞ ◕ ) nn-mediapipe: still ${what}... if this keeps happening, try reloading the page (if this is a new version of the library, the CDN may still be preparing its files)`)
    }, 15000)
    return () => clearTimeout(timer)
  }

  // downloads a file ourselves (rather than letting MediaPipe do it), as
  // 'text' or 'arrayBuffer'. we do this because MediaPipe's own downloads
  // sometimes silently stall or never start in some setups (ex: inside
  // netnet.studio's preview), and this way we can warn when that happens
  async function download (url, as, log) {
    const name = url.split('/').pop()
    const start = window.performance.now()
    const done = warnIfSlow(`downloading ${name}`)
    log(`downloading ${name}`)
    try {
      const res = await window.fetch(url)
      if (!res.ok) throw new Error(`( ◕ ◞ ◕ ) nn-mediapipe: couldn't download ${url} (${res.status})`)
      const data = await res[as]()
      log(`downloaded ${name} (${secs(start)}s)`)
      return data
    } finally {
      done()
    }
  }

  // MediaPipe's library + WebAssembly engine are shared by every model,
  // so we only load them once (per folder)
  const engines = {}
  function loadEngine (base, log) {
    if (!engines[base]) {
      engines[base] = (async () => {
        const done = warnIfSlow('loading the MediaPipe library')
        log('loading the MediaPipe library')
        const lib = await import(new URL('mediapipe/vision_bundle.mjs', base).href)
        done()
        const wasm = new URL('mediapipe/wasm/', base).href
        // MediaPipe normally loads its engine by adding a <script> tag to the
        // page and then fetching the .wasm file itself, but those silently
        // fail in some setups (ex: Firefox, inside netnet.studio's preview).
        // So we download both ourselves and hand them to MediaPipe (see load())
        const [code, wasmBinary] = await Promise.all([
          download(wasm + 'vision_wasm_internal.js', 'text', log),
          download(wasm + 'vision_wasm_internal.wasm', 'arrayBuffer', log)
        ])
        const fileset = { wasmBinaryPath: wasm + 'vision_wasm_internal.wasm' }
        try {
          // the .js file defines a function called ModuleFactory, which starts the engine
          const factory = new Function(code + '\nreturn ModuleFactory')() // eslint-disable-line no-new-func
          return { lib, fileset, factory, wasmBinary }
        } catch (err) {
          // if that doesn't work (ex: a page that doesn't allow it), let
          // MediaPipe load the engine the usual way
          console.warn('( ◕ ◞ ◕ ) nn-mediapipe: loading the engine the usual way', err)
          return { lib, fileset: await lib.FilesetResolver.forVisionTasks(wasm.slice(0, -1)) }
        }
      })()
    }
    return engines[base]
  }

  // MediaPipe gives us points from 0 to 1 (relative to the video's image),
  // this converts them to page pixels, lined up with the video element as it
  // appears on screen (its size, position, object-fit and mirroring)
  function pageMapper (video, mirror, visibility) {
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
    return (p) => {
      const point = {
        x: left + (mirror ? 1 - p.x : p.x) * w,
        y: top + p.y * h,
        z: p.z
      }
      // (pose only) how likely this point is to be visible, from 0 to 1
      if (visibility) point.visibility = p.visibility
      return point
    }
  }

  class Tracker {
    constructor (landmarker, info) {
      this.raw = landmarker // the MediaPipe object itself, for anything this doesn't cover
      this.results = null // MediaPipe's full results for the latest frame (0 to 1 values, plus extras)
      this._info = info
      this._lastTime = -1
    }

    // runs the model on the video's current frame and returns what it found:
    // an array with one entry per hand (or face, or body), each an array of
    // { x, y, z } points in page pixels. pass { mirror: true } if your video
    // is displayed mirrored (like a selfie camera). extras:
    //   hands have a .side property: 'left' or 'right'
    //   faces have a .blendshapes object (if outputFaceBlendshapes is true)
    //   pose points have a .visibility value
    detect (video, opts = {}) {
      // only run the model when the camera has a new frame for us
      if (video.readyState >= 2 && video.currentTime !== this._lastTime) {
        this._lastTime = video.currentTime
        this.results = this.raw.detectForVideo(video, window.performance.now())
      }
      if (!this.results) return []
      const toPage = pageMapper(video, opts.mirror, this._info.visibility)
      return this.results[this._info.points].map((points, i) => {
        const found = points.map(toPage)
        // which hand it is, from the person's point of view ('left' or 'right')
        const label = this.results.handedness?.[i]?.[0]?.categoryName
        if (label) found.side = label.toLowerCase()
        // the face's expression, as named scores from 0 to 1 (ex: jawOpen)
        const shapes = this.results.faceBlendshapes?.[i]?.categories
        if (shapes) {
          found.blendshapes = {}
          for (const s of shapes) found.blendshapes[s.categoryName] = s.score
        }
        return found
      })
    }
  }

  // loads a model, ex: await load('hands', { numHands: 2 })
  // any MediaPipe option can be passed, plus:
  //   assets: path to this folder (only needed if loading this file as a module)
  //   model: path to a different .task model file
  //   debug: true to log each loading step (and how long it took) in the console
  async function load (type, opts = {}) {
    const { assets, model, debug, ...options } = opts
    const log = debug ? (msg) => console.log(`( ◕ ◞ ◕ ) nn-mediapipe: ${msg}`) : () => {}
    const start = window.performance.now()
    const base = assets
      ? new URL(assets.endsWith('/') ? assets : assets + '/', document.baseURI).href
      : BASE
    if (!base) {
      throw new Error('( ◕ ◞ ◕ ) nn-mediapipe: I can\'t tell where my files are, pass the folder\'s path as { assets: \'path/to/src/\' }')
    }

    const info = MODELS[type]
    const userModel = options.baseOptions?.modelAssetPath || options.baseOptions?.modelAssetBuffer
    const modelUrl = model ? new URL(model, document.baseURI).href : new URL(info.file, base).href

    // download the model (unless you passed your own) while the engine loads
    const [engine, modelData] = await Promise.all([
      loadEngine(base, log),
      userModel ? null : download(modelUrl, 'arrayBuffer', log)
    ])
    const { lib, fileset, factory, wasmBinary } = engine

    const settings = {
      runningMode: 'VIDEO',
      ...options,
      baseOptions: {
        delegate: 'GPU', // run on the graphics card when possible
        ...options.baseOptions
      }
    }
    // the model's numbers, as data (so MediaPipe doesn't download it again)
    if (modelData) settings.baseOptions.modelAssetBuffer = new Uint8Array(modelData)

    const create = () => {
      // MediaPipe expects the engine's ModuleFactory (and its settings, the
      // Module) to be globals, and clears them each time a model is created,
      // so we set them every time. wasmBinary is the engine we downloaded
      if (factory) {
        window.ModuleFactory = factory
        window.Module = { wasmBinary }
      }
      return lib[info.task].createFromOptions(fileset, settings)
    }

    log('starting the model')
    const done = warnIfSlow('starting the model')
    let landmarker
    try {
      landmarker = await create()
    } catch (err) {
      if (settings.baseOptions.delegate !== 'GPU') throw err
      console.warn('( ◕ ◞ ◕ ) nn-mediapipe: couldn\'t use the GPU, using the CPU instead')
      settings.baseOptions.delegate = 'CPU'
      landmarker = await create()
    } finally {
      done()
    }
    log(`${type} model ready (${secs(start)}s)`)
    return new Tracker(landmarker, info)
  }

  // add nn.hands(), nn.face() and nn.pose()
  for (const type in MODELS) {
    if (window.nn[type]) console.warn(`( ◕ ◞ ◕ ) nn-mediapipe: nn.${type} already exists, replacing it`)
    window.nn[type] = (opts) => load(type, opts)
  }
})()
