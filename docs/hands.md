# nn.hands: getting started

`nn.hands()` adds **hand tracking** to your sketches. It uses a machine learning model to find hands in your camera's video and gives you the positions of 21 points on each hand: fingertips, knuckles and wrist. Those points are page coordinates, just like `nn.mouseX` and `nn.mouseY`, so anything you can do with the mouse, you can do with your hands.

The model runs **in your browser**. Your camera video is never sent anywhere.

## Setup

Load `nn` first, then the extension:

```html
<script src="https://cdn.jsdelivr.net/gh/netizenorg/netnet-standard-library@1.0.1/build/nn.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/netizenorg/netnet-machine-learning@0.1.0/src/nn-mediapipe.js"></script>
```

Your page has to be served by a server (an `http://` or `https://` address), not opened by double-clicking the file. The model files can't load from `file://`.

### Working offline

To run everything from your own computer instead of a CDN, download this repo's `src` folder, put it next to your HTML file, and load the extension from there:

```html
<script src="src/nn-mediapipe.js"></script>
```

Keep everything inside `src` together. The extension finds its other files relative to itself:

```
src/
  nn-mediapipe.js     ← the extension
  mediapipe/          ← the code that runs the model
  models/             ← the model itself (the trained "weights")
```

## Hello World: 🔥 on your fingertip

```html
<body style="margin: 0;"></body>
<script src="https://cdn.jsdelivr.net/gh/netizenorg/netnet-standard-library@1.0.1/build/nn.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/netizenorg/netnet-machine-learning@0.1.0/src/nn-mediapipe.js"></script>
<script>
  let video, hands, flame

  async function setup () {
    video = nn.create('video')
      .set({
        autoplay: true,
        muted: true,
        playsinline: true,
        stream: await nn.askFor('video')
      })
      .scale(-1, 1) // mirror it, like a selfie camera
      .addTo('body')

    flame = nn.create('div')
      .content('🔥')
      .addTo('body')
      .positionOrigin('center')
      .css('font-size', 48)
      .opacity(0)

    flame.data.hue = 0


    hands = await nn.hands() // load the model
  }

  function animate () {
    requestAnimationFrame(animate)
    if (!hands) return

    const found = hands.detect(video, { mirror: true })
    const hand = found[0] // the first hand it sees (if any)

    if (hand) {
      const tip = hand[8] // index fingertip
      flame.opacity(1)
      flame.position(tip.x, tip.y)
      flame.data.hue += 10
      flame.hueRotate(flame.data.hue)
    } else {
      flame.opacity(0)
    }
  }

  nn.on('load', setup)
  nn.on('load', animate)
</script>
```

Allow camera access, hold up your hand, and the 🔥 follows your index finger. (This is `examples/hands-hello.html`.)

## How it works

**1. Load the model.**
```js
hands = await nn.hands()
```
This downloads the model the first time (a few seconds), so it needs `await`. Behind that one line, the extension loads the code that runs the model, and the model itself: several megabytes of numbers that came from training.

**2. Ask it what it sees.**
```js
const found = hands.detect(video, { mirror: true })
```
Call this every frame (inside your animation loop). It looks at the video's current frame and returns an **array of hands**. If no hands are visible, the array is empty. Pass `{ mirror: true }` when your video is mirrored with `.scale(-1, 1)`, so the points line up with what you see.

**3. Use the points.**
Each hand is an array of 21 points, and each point has:
- `x`, `y`: where it is on the page, in pixels, lined up with the video wherever it is on the page and however big it is
- `z`: roughly how close it is to the camera (smaller is closer)

Each hand also has a `side`: `'left'` or `'right'`.

```js
for (const hand of found) {
  if (hand.side === 'right') { /* do something */ }
}
```

## The 21 points

```
            8   12  16  20      ← fingertips
            |   |   |   |
            7   11  15  19
            |   |   |   |
     4      6   10  14  18
     |      |   |   |   |
     3      5---9---13--17      ← knuckles
      \     |           |
       2    |           |
        \   |           |
         1  |           |
          \ |           |
            0                   ← wrist
```

| Point | Where |
|---|---|
| 0 | wrist |
| 1–4 | thumb (4 = tip) |
| 5–8 | index finger (8 = tip) |
| 9–12 | middle finger (12 = tip) |
| 13–16 | ring finger (16 = tip) |
| 17–20 | pinky (20 = tip) |

## Recipe: pinch detection

Measure the gap between the thumb tip (4) and the index tip (8). Divide it by the hand's size, so it works whether your hand is near the camera or far away:

```js
function isPinching (hand) {
  const handSize = nn.dist(hand[0].x, hand[0].y, hand[9].x, hand[9].y)
  const gap = nn.dist(hand[4].x, hand[4].y, hand[8].x, hand[8].y) / handSize
  return gap < 0.3
}
```

See `examples/hands-draw.html` for pinch drawing with your right hand, and tapping to clear with your left.

## Options

Any of the model's settings can be passed when loading:

```js
hands = await nn.hands({ numHands: 2 }) // track up to 2 hands (default is 1)
```

### Hand tracking options

| Option | Default | What it does |
|---|---|---|
| `numHands` | `1` | The most hands it will look for at once. |
| `minHandDetectionConfidence` | `0.5` | How sure (0 to 1) the palm detector must be before it reports a new hand. Higher means fewer false alarms, but hands are harder to pick up. |
| `minHandPresenceConfidence` | `0.5` | How sure (0 to 1) the landmark model must be that it's still looking at a hand. Below this, it goes back to searching the whole image for palms. |
| `minTrackingConfidence` | `0.5` | How closely (0 to 1) a hand's position must match the previous frame for MediaPipe to keep following it. Below this, it searches the whole image for palms again. |

The last three settings relate to the two models inside the hand tracker: one finds palms, the other finds the 21 points. See the [model's notes](../src/models/hand_landmarker.md#how-it-works) for how they work together.

### Options for this library

| Option | Default | What it does |
|---|---|---|
| `model` | the included `hand_landmarker.task` | The path to a different `.task` model file. |
| `assets` | worked out automatically | The path to the `src` folder. Only needed if you load `nn-mediapipe.js` as a JavaScript module (`import`), rather than with a `<script>` tag. |
| `debug` | `false` | Set to `true` to log each loading step (and how long it took) in the console. Handy if loading seems stuck. |

### Advanced MediaPipe options

These are set for you, so you usually won't need them:

| Option | Default | What it does |
|---|---|---|
| `baseOptions.delegate` | `'GPU'` | Runs the model on your graphics card (`'GPU'`) or processor (`'CPU'`). If the GPU doesn't work, this library switches to the CPU automatically. |
| `runningMode` | `'VIDEO'` | MediaPipe's mode for video frames. Leave this as it is: `detect()` needs it. |
| `baseOptions.modelAssetPath` | none | Where MediaPipe should load a model from itself. Usually leave this out: this library downloads the model for you (use `model` to choose a different file). |
| `baseOptions.modelAssetBuffer` | none | The model's contents as data, rather than a file path (for example, a model loaded with `fetch()`). |
| `canvas` | none | A `<canvas>` for MediaPipe to use for GPU processing. MediaPipe creates its own if you don't give it one. |

These are the options for the version of MediaPipe included in this library (`@mediapipe/tasks-vision` 1.0.1).

## Going further

- **Everything the model returns:** `hands.results` has the model's full, raw output for the latest frame, including confidence scores and 3D "world" coordinates in meters.
- **The model itself:** `hands.raw` is the underlying MediaPipe object, for anything this extension doesn't cover.

## Troubleshooting

- **Nothing happens / errors about loading files:** make sure your page is served by a server (not `file://`). If you're working offline, check that the whole `src` folder is next to your HTML file.
- **It seems stuck loading:** the very first download of the model files (about 20 MB) can sometimes take up to a minute, while the server fetches them. Give it time before reloading, and don't edit your code while it loads (in netnet, each edit restarts the page). Load with `nn.hands({ debug: true })` to see each step in the console; if a download takes longer than 15 seconds, you'll also see a "still downloading..." warning (make sure warnings aren't hidden in your console's filter). Once downloaded, the files are saved by your browser, so later visits are fast.
- **No camera:** check your browser's camera permission for the page.
- **The points are on the wrong side:** if your video is mirrored, pass `{ mirror: true }` to `detect()`. If it isn't mirrored, leave it out.
- **The console warns "couldn't use the GPU":** that's fine. The model runs on your processor instead, just a bit slower.

## Where does this model come from?

The hand model was made by Google's MediaPipe team and is released under the Apache License 2.0. According to [Google's model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Hand%20Tracking%20(Lite_Full)%20with%20Fairness%20Oct%202021.pdf):

- It was trained on images including consented images captured with a smartphone AR (augmented reality) app.
- It's intended for things like gesture recognition and hand control. Google says "any form of surveillance or identity recognition is explicitly out of scope."
- It's not designed for hands in gloves, hands holding objects, or hands decorated with jewelry, tattoos or henna.
- Google tested its accuracy across 14 world regions, 6 skin tones and 2 genders. Accuracy varied between groups, but Google reports finding no consistent pattern of errors related to region, skin tone or gender.

For more (what's inside the model file, how its two models work together, how big it is, how it was trained, and questions to think about), see [the model's notes](../src/models/hand_landmarker.md).
