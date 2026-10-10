# face_landmarker.task

*Part of the [model notes](README.md) for netnet-machine-learning.*

## At a glance

| | |
|---|---|
| **What it does** | Finds faces in an image and predicts 478 points on each (eyes, eyebrows, nose, lips, face outline, irises), and optionally scores for the face's expression ("blendshapes") |
| **Used by** | `nn.face()` |
| **Made by** | Google's MediaPipe team |
| **License** | Apache License 2.0 (free to use, change and share, with credit) |
| **Changed by us?** | No, this is Google's original file |
| **Size** | 3.8 MB |

## What's inside

Like all `.task` files, this is a zip file with a different name (see [hand_landmarker.md](hand_landmarker.md#whats-inside) for more on `.task` and `.tflite` files). Run `unzip face_landmarker.task -d face_landmarker` to unzip it. This one holds **three** models and a settings file:

```
face_landmarker.task
  ├─ face_detector.tflite                            (0.2 MB)  step 1: find the faces
  ├─ face_landmarks_detector.tflite                  (2.6 MB)  step 2: find the 478 points
  ├─ face_blendshapes.tflite                         (1.0 MB)  step 3: measure the expression
  └─ geometry_pipeline_metadata_landmarks.binarypb   (0.02 MB) settings: a description of a standard 3D face
```

## How it works

1. **The face detector** looks at the whole image, shrunk to just 128 × 128 pixels, and answers *"where are the faces?"* with a box around each one. (Google calls it BlazeFace.)
2. **The landmark model** (Google calls it FaceMesh) looks at the area around one face, at 256 × 256 pixels, and predicts the 478 points as a 3D "mesh" of the face's surface. It also says how likely it is that there's still a face there.
3. **The blendshapes model** (only if you ask for it with `outputFaceBlendshapes: true`) takes 146 of those points and turns them into about 50 named scores from 0 to 1, like `jawOpen` or `eyeBlinkLeft`. It never looks at the image itself, only at the points.

As with hands, MediaPipe doesn't run step 1 every frame: once it's found a face, it uses where the face was in the last frame to decide where to look next, and only goes back to the face detector when it loses track.

## By the numbers

The weights are stored as 16-bit numbers (2 bytes each), so the file sizes give a rough count:

- **Face detector:** about **115,000** numbers
- **Landmark model:** about **1.3 million** numbers
- **Blendshapes model:** about **480,000** numbers
- **Together:** roughly **1.9 million** numbers

(These are estimates: the files also contain the structure, not only weights.) The face detector is tiny: Google reports it runs at about 275 frames per second on a 2017 phone.

## Who made it, and why

The three models were made by researchers at Google, named in their model cards: Valentin Bazarevsky (face detector, 2021); Geng Yan and Ivan Grishchenko (landmark model, 2022); and Ivan Grishchenko, Geng Yan, Andrei Zanfir and Eduard Gabriel Bazavan (blendshapes, 2022).

According to Google's model cards, they were made for **augmented reality (AR) entertainment** on smartphones, such as face filters and avatars that copy your expressions, and (for the face detector) "assistive technologies."

## How it learned

According to Google's model cards:

- **The face detector** was trained on "consented images of people using a mobile AR application," taken with many kinds of phone cameras in real-world conditions.
- **The landmark model** was trained on images captured the same way. People marked the points by hand: Google mentions 11 human annotators who labelled the training data. Its 3D depth (`z`) values come from synthetic data (a 3D computer model of a face), not real measurements.
- **The blendshapes model** learned differently: from people recorded in a lab, from many angles at once, performing a set of facial expressions, rebuilt as 3D faces. The 52 expression shapes it measures were **designed by an artist**. Google then generated "millions" of training examples from those recordings.

The model cards don't say how many people were photographed, or who they were.

## Limits and fairness

From Google's model cards:

- **Designed for selfies:** a face looking at the camera, fairly close, in good light. It can lose faces that turn away more than 80°, are tilted, are less than half visible, or are too far away (the face detector is designed for faces within about 2 meters).
- **No recognition:** Google says the points "do not provide facial recognition or identification and do not store any unique face representation," and that "any form of surveillance or identity recognition is explicitly out of scope." It finds the shape of *a* face, not *whose* face it is.
- **Fairness testing:**
  - The **landmark model** was tested on faces from 17 world regions, 6 skin tones (on the Fitzpatrick scale) and 2 genders. Its error varied between groups. By skin tone, it was highest for the lightest skin tone tested, which made up only 1.5% of the test data. Google set its own standard (differences smaller than the disagreement between its human annotators) and reports the model met it.
  - The **face detector** found 94.7% to 100% of faces across skin tones, and 92.5% to 100% across regions.
  - The **blendshapes model** was tested on 511 lab recordings across 2 genders and 10 skin tones (on a different scale, the Monk scale), with small differences that Google reports were within its standard.

## Things to think about

- An artist designed the 52 expressions this model can measure. What feelings or expressions might not fit into those 52? Whose faces might it read "wrong"?
- Google says this model doesn't identify people. But a face is personal: could points like these ever be misused? Who should decide how face-tracking tools are used?
- Each model was tested with a different set of groups and scales (17 regions; 6 or 10 skin tones; "perceived" gender). Who decides which groups to test for fairness?

## Sources

- **Google's model cards:** [BlazeFace (face detector)](https://storage.googleapis.com/mediapipe-assets/MediaPipe%20BlazeFace%20Model%20Card%20(Short%20Range).pdf) (June 2021), [Face Mesh V2 (landmarks)](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf) (September 2022), [Blendshape V2](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Blendshape%20V2.pdf) (November 2022)
- **Documentation:** [MediaPipe Face Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)
- **Downloaded from:** https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
- **License:** [Apache License 2.0](../mediapipe/LICENSE)
