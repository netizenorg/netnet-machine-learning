# nn.pose: getting started

`nn.pose()` adds **body tracking** to your sketches. It finds a person in your camera's video and gives you the positions of 33 points on their body (face, shoulders, elbows, wrists, hips, knees, ankles, feet). The points are page coordinates, just like `nn.mouseX` and `nn.mouseY`.

The model runs **in your browser**. Your camera video is never sent anywhere.

`nn.pose()` works just like [`nn.hands()`](hands.md), so if you've used that, you already know how this works.

## Setup

```html
<script src="https://cdn.jsdelivr.net/gh/netizenorg/netnet-standard-library@1.0.1/build/nn.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/netizenorg/netnet-machine-learning@0.1.0/src/nn-mediapipe.js"></script>
```

Your page has to be served by a server (not opened as a `file://`). To work offline, see [Working offline](hands.md#working-offline).

## Hello World: a stick figure

```js
let video, pose, canvas

// pairs of points to connect with lines
const bones = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // shoulders + arms
  [11, 23], [12, 24], [23, 24], // body
  [23, 25], [25, 27], [24, 26], [26, 28] // legs
]

async function setup () {
  video = nn.create('video')
    .set({ autoplay: true, muted: true, playsinline: true, stream: await nn.askFor('video') })
    .css({ width: '100%', height: '100vh', objectFit: 'contain', opacity: 0.5 })
    .scale(-1, 1) // mirror it, like a selfie camera
    .addTo('body')

  canvas = nn.create('canvas').position(0, 0).addTo('body').resize(nn.width, nn.height)
  canvas.strokeColor = 'white'
  canvas.fillColor = 'white'
  canvas.lineWidth = 4

  pose = await nn.pose() // load the model
}

function animate () {
  requestAnimationFrame(animate)
  if (!pose) return

  canvas.clear()
  const body = pose.detect(video, { mirror: true })[0] // the first body (if any)
  if (!body) return

  for (const [a, b] of bones) canvas.line(body[a].x, body[a].y, body[b].x, body[b].y)
  for (const point of body) {
    canvas.globalAlpha = point.visibility // faint if the point might be hidden
    canvas.circle(point.x, point.y, 8)
  }
  canvas.globalAlpha = 1
}

nn.on('load', setup)
nn.on('load', animate)
```

Step back from the camera so it can see your body, and a stick figure follows you. (This is `examples/pose-hello.html`.)

## How it works

The same three steps as [`nn.hands()`](hands.md#how-it-works):
1. **Load the model:** `pose = await nn.pose()`
2. **Ask it what it sees, every frame:** `const found = pose.detect(video, { mirror: true })` gives you an **array of bodies** (empty if it sees none).
3. **Use the points:** each body is an array of 33 points, each with:
   - `x`, `y`: where it is on the page, in pixels
   - `z`: roughly how far in front of (negative) or behind (positive) the hips it is
   - `visibility`: how sure the model is (0 to 1) that the point is in view and not hidden, for example behind your other arm or out of the frame

The model still guesses where hidden points are, so check `visibility` if it matters: `if (point.visibility > 0.5) { ... }`.

## The 33 points

"Left" and "right" are from the person's point of view.

| Point | Where | Point | Where |
|---|---|---|---|
| 0 | nose | | |
| 1, 2, 3 | left eye (inner, center, outer) | 4, 5, 6 | right eye (inner, center, outer) |
| 7 | left ear | 8 | right ear |
| 9 | mouth, left corner | 10 | mouth, right corner |
| 11 | left shoulder | 12 | right shoulder |
| 13 | left elbow | 14 | right elbow |
| 15 | left wrist | 16 | right wrist |
| 17 | left pinky knuckle | 18 | right pinky knuckle |
| 19 | left index knuckle | 20 | right index knuckle |
| 21 | left thumb knuckle | 22 | right thumb knuckle |
| 23 | left hip | 24 | right hip |
| 25 | left knee | 26 | right knee |
| 27 | left ankle | 28 | right ankle |
| 29 | left heel | 30 | right heel |
| 31 | left foot (toes) | 32 | right foot (toes) |

## Recipe: is a hand raised?

On a web page, `y` gets *bigger* going down, so a wrist that's higher than its shoulder has a *smaller* `y`:

```js
const leftHandUp = body[15].y < body[11].y // left wrist above left shoulder
const rightHandUp = body[16].y < body[12].y // right wrist above right shoulder
```

## Options

```js
pose = await nn.pose({ numPoses: 2 })
```

| Option | Default | What it does |
|---|---|---|
| `numPoses` | `1` | The most bodies it will look for at once. |
| `minPoseDetectionConfidence` | `0.5` | How sure (0 to 1) the detector must be before it reports a new body. |
| `minPosePresenceConfidence` | `0.5` | How sure (0 to 1) the pose model must be that it's still looking at a body. Below this, it searches the whole image again. |
| `minTrackingConfidence` | `0.5` | How closely (0 to 1) a body's position must match the previous frame for MediaPipe to keep following it. |
| `outputSegmentationMasks` | `false` | (Advanced) Also return a "mask" image of where the person is (to separate them from the background). Find it in `pose.results`. |

The `model` and `assets` options, and the advanced MediaPipe options (like `baseOptions.delegate`), work the same as for [`nn.hands()`](hands.md#options-for-this-library). These are the options for the version of MediaPipe included in this library (`@mediapipe/tasks-vision` 1.0.1).

### About the model size

This library includes the **lite** version of Google's pose model: the smallest and fastest. Google also makes **full** and **heavy** versions, which are more accurate but bigger and slower (see the [model's notes](../src/models/pose_landmarker_lite.md)). To use one, download it to your own project and pass its path: `nn.pose({ model: 'pose_landmarker_full.task' })`.

## Going further

- **Everything the model returns:** `pose.results` has the model's full, raw output for the latest frame, including 3D "world" coordinates in meters.
- **The model itself:** `pose.raw` is the underlying MediaPipe object.

## Troubleshooting

- **It can't find you:** step back so more of your body is in view, and make sure your **head is visible** (the model looks for your face first). It works best within about 4 meters of the camera.
- **The points jump around:** better lighting helps, and so does less motion blur.
- **It only finds one person:** the model is designed for one person at a time; `numPoses` can ask for more, but it works best with one.
- For other problems (loading, camera, mirroring, GPU), see [nn.hands troubleshooting](hands.md#troubleshooting).

## Where does this model come from?

The pose model was made by Google's MediaPipe team and is released under the Apache License 2.0. Google designed it mainly for fitness apps (like counting exercise repetitions), augmented reality, and gesture recognition, and says that "any form of surveillance or identity recognition is explicitly out of scope."

For more (what's inside the model file, how it was trained, and its limits), see [the model's notes](../src/models/pose_landmarker_lite.md).
