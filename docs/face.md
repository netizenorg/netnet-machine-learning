# nn.face: getting started

`nn.face()` adds **face tracking** to your sketches. It finds faces in your camera's video and gives you the positions of 478 points on each one (around the eyes, eyebrows, nose, lips, face outline and irises), plus, if you ask, scores for the face's expression. The points are page coordinates, just like `nn.mouseX` and `nn.mouseY`.

The model runs **in your browser**. Your camera video is never sent anywhere.

`nn.face()` works just like [`nn.hands()`](hands.md), so if you've used that, you already know how this works.

## Setup

```html
<script src="https://cdn.jsdelivr.net/gh/netizenorg/netnet-standard-library@1.0.1/build/nn.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/netizenorg/netnet-machine-learning@0.1.0/src/nn-mediapipe.js"></script>
```

Your page has to be served by a server (not opened as a `file://`). To work offline, see [Working offline](hands.md#working-offline).

## Hello World: 😎 

```js
let video, face, emoji

async function setup () {
  video = nn.create('video')
    .set({ autoplay: true, muted: true, playsinline: true, stream: await nn.askFor('video') })
    .scale(-1, 1) // mirror it, like a selfie camera
    .addTo('body')

  emoji = nn.create('div').content('😎').addTo('body').positionOrigin('center')

  // load the model, and also ask it for the face's expression ("blendshapes")
  face = await nn.face({ outputFaceBlendshapes: true })
}

function animate () {
  requestAnimationFrame(animate)
  if (!face) return

  const f = face.detect(video, { mirror: true })[0] // the first face (if any)
  if (!f) return

  const eyeA = f[33] // outer corner of one eye
  const eyeB = f[263] // outer corner of the other eye
  const eyes = nn.dist(eyeA.x, eyeA.y, eyeB.x, eyeB.y)

  emoji.content(f.blendshapes.jawOpen > 0.3 ? '😮' : '😎') // open your mouth!
    .css('font-size', eyes * 2)
    .position((eyeA.x + eyeB.x) / 2, (eyeA.y + eyeB.y) / 2 + eyes * 0.4)
}

nn.on('load', setup)
nn.on('load', animate)
```

The sunglasses follow your face and grow as you get closer, and change to 😮 when you open your mouth. (This is `examples/face-hello.html`.)

## How it works

The same three steps as [`nn.hands()`](hands.md#how-it-works):
1. **Load the model:** `face = await nn.face()`
2. **Ask it what it sees, every frame:** `const found = face.detect(video, { mirror: true })` gives you an **array of faces** (empty if it sees none).
3. **Use the points:** each face is an array of 478 points, each with `x`, `y` (page pixels) and `z` (roughly how close it is to the camera).

## The points

With 478 points, there are too many to list. These are some useful ones ("left" and "right" are from the person's point of view):

| Point | Where |
|---|---|
| 1 | tip of the nose |
| 10 | top of the forehead |
| 152 | chin |
| 33, 133 | right eye: outer and inner corners |
| 263, 362 | left eye: outer and inner corners |
| 61, 291 | corners of the mouth |
| 13, 14 | middle of the upper and lower lips (inside edge) |
| 468 | center of the right iris |
| 473 | center of the left iris |

**To find any other point,** draw them all with their numbers and look for the one you want:

```js
// with a canvas covering the page (see examples/pose-hello.html for a canvas setup)
f.forEach((point, i) => canvas.text(i, point.x, point.y))
```

## Expressions ("blendshapes")

Load the model with `outputFaceBlendshapes: true`, and each face also has a `blendshapes` object: named scores from `0` to `1` for parts of an expression, such as:

- `jawOpen`, `mouthSmileLeft`, `mouthSmileRight`, `mouthPucker`, `mouthFrownLeft`
- `eyeBlinkLeft`, `eyeBlinkRight`, `eyeWideLeft`, `eyeSquintRight`
- `browInnerUp`, `browDownLeft`, `cheekPuff`, `noseSneerLeft`

There are about 50 in total. To see them all, and how they change as you move your face, try:

```js
console.log(f.blendshapes)
```

"Blendshapes" come from 3D animation, where a character's face is animated by mixing ("blending") a set of expressions. These scores are what you'd use to make an avatar copy your face.

## Options

```js
face = await nn.face({ numFaces: 2, outputFaceBlendshapes: true })
```

| Option | Default | What it does |
|---|---|---|
| `numFaces` | `1` | The most faces it will look for at once. |
| `outputFaceBlendshapes` | `false` | Also measure the face's expression (see above). |
| `minFaceDetectionConfidence` | `0.5` | How sure (0 to 1) the face detector must be before it reports a new face. |
| `minFacePresenceConfidence` | `0.5` | How sure (0 to 1) the face model must be that it's still looking at a face. Below this, it searches the whole image again. |
| `minTrackingConfidence` | `0.5` | How closely (0 to 1) a face's position must match the previous frame for MediaPipe to keep following it. |
| `outputFacialTransformationMatrixes` | `false` | (Advanced) Also return each face's 3D position and rotation as a matrix, for placing 3D objects on the face. Find them in `face.results`. |

The `model` and `assets` options, and the advanced MediaPipe options (like `baseOptions.delegate`), work the same as for [`nn.hands()`](hands.md#options-for-this-library). These are the options for the version of MediaPipe included in this library (`@mediapipe/tasks-vision` 1.0.1).

## Going further

- **Everything the model returns:** `face.results` has the model's full, raw output for the latest frame.
- **The model itself:** `face.raw` is the underlying MediaPipe object.

## Troubleshooting

- **It loses your face:** face the camera, keep your whole face in view, and don't tilt your head too far. The model works best with faces close to the camera, like a selfie.
- **`f.blendshapes` is undefined:** load the model with `outputFaceBlendshapes: true`.
- For other problems (loading, camera, mirroring, GPU), see [nn.hands troubleshooting](hands.md#troubleshooting).

## Where does this model come from?

The face model was made by Google's MediaPipe team and is released under the Apache License 2.0. It's actually three models working together: one finds faces, one finds the 478 points, and one measures expressions. Google says these models do **not** recognise or identify people: they find the shape of *a* face, not *whose* face it is.

For more (what's inside the model file, how its models work together, how they were trained, and their limits), see [the model's notes](../src/models/face_landmarker.md).
