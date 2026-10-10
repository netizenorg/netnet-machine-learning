# pose_landmarker_lite.task

*Part of the [model notes](README.md) for netnet-machine-learning.*

## At a glance

| | |
|---|---|
| **What it does** | Finds a person in an image and predicts 33 points on their body (face, shoulders, elbows, wrists, hips, knees, ankles, feet), with how visible each point is |
| **Used by** | `nn.pose()` |
| **Made by** | Google's MediaPipe team |
| **License** | Apache License 2.0 (free to use, change and share, with credit) |
| **Changed by us?** | No, this is Google's original file |
| **Size** | 5.8 MB |

## What's inside

Like all `.task` files, this is a zip file with a different name (see [hand_landmarker.md](hand_landmarker.md#whats-inside) for more on `.task` and `.tflite` files). Run `unzip pose_landmarker_lite.task -d pose_landmarker_lite` to unzip it. This one holds two models:

```
pose_landmarker_lite.task
  ├─ pose_detector.tflite              (3.0 MB)  step 1: find the person
  └─ pose_landmarks_detector.tflite    (2.8 MB)  step 2: find the 33 points
```

## How it works

1. **The detector** looks at the whole image, shrunk to 224 × 224 pixels, to find the person and work out how their body is positioned. It starts from the person's **face**, which is why the head needs to be visible.
2. **The landmark model** looks at the area around the body, at 256 × 256 pixels, and predicts each of the 33 points, with:
   - its position (`x`, `y`, and a depth `z` relative to the hips)
   - its **visibility**: how likely it is to be in view and not hidden behind something
   - its **presence**: how likely it is to be inside the frame at all

As with hands, MediaPipe doesn't run step 1 every frame: once it's found a person, it uses the last frame's points to decide where to look next.

## By the numbers

The weights are stored as 16-bit numbers (2 bytes each), so the file sizes give a rough count:

- **Detector:** about **1.5 million** numbers
- **Landmark model:** about **1.4 million** numbers
- **Together:** roughly **2.9 million** numbers

(These are estimates: the files also contain the structure, not only weights.) This is the **lite** version. Google also makes **full** and **heavy** versions with bigger landmark models (Google's model card gives sizes of 3 MB, 6 MB and 26 MB for the three) that are more accurate but slower: on a 2018 phone's processor, Google reports about 44 frames per second for lite, 18 for full, and 4 for heavy. We include lite because it's fast on most laptops. (The heavy file is also too big for this library's CDN.)

## Who made it, and why

The model was made by researchers at Google, named in its model card: Valentin Bazarevsky, Ivan Grishchenko and Eduard Gabriel Bazavan (April 2021). It's based on their research paper "BlazePose: On-device Real-time Body Pose tracking" (2020).

According to Google's model card, it was "optimized for on-device, real-time **fitness applications**," like counting exercise repetitions, as well as augmented reality and gesture recognition. Google says its "primary intended application is entertainment."

## How it learned

According to Google's model card:

- It was trained on images including about **30,000 consented images** of people using a smartphone AR app, in real-world conditions.
- **Most of the training images (about 85,000) show fitness poses.**
- People marked the points by hand. When a point was hidden or hard to see, they marked a "best guess."
- The depth (`z`) values come from synthetic data (a 3D computer model of the human body called GHUM), not real measurements.

The model card doesn't say who the people in the images were.

## Limits and fairness

From Google's model card:

- **Designed for:** one person at a time, with their head visible, within about 4 meters of the camera. It can "jitter" (points shake) in low light or with fast motion. Its depth values aren't real-world measurements.
- **Explicitly not for:** "any form of surveillance or identity recognition."
- **Bodies the training didn't expect:** Google says the model was checked with "users with missing limbs and prosthetics," and that it "degrades gracefully by predicting average point location." In other words, for a limb that isn't there, it guesses where an average limb would be.
- **Fairness testing:** Google measured how many points the model got right on people from 14 world regions, 6 skin tones (on the Fitzpatrick scale) and 2 genders. For the lite model:
  - by region: 83.2% to 89.7% of points correct
  - by skin tone: lowest (80.5%) for the lightest skin tone tested, which made up only 1.3% of the test data, and up to 87.8% for others
  - by gender: 86.0% for women and 89.1% for men
  - Google's own standard counts a model as unfair if the gap between groups is bigger than 7.5 percentage points. The lite model's gaps were 6.5 (region), 7.3 (skin tone) and 3.1 (gender), so Google reports it as fair, though the skin tone gap is close to the line.

## Things to think about

- For someone with a missing limb, the model invents an "average" one. What does it mean for a model to have an idea of an "average" body? Whose bodies might it get wrong?
- Most of its training images show fitness poses. How might that shape what it's good (and bad) at? What kinds of movement might it struggle with?
- Google's standard for "fair" allows a gap of up to 7.5 points between groups. Is that a good line? Who should get to decide?

## Sources

- **Google's model card:** [BlazePose GHUM 3D](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20BlazePose%20GHUM%203D.pdf) (April 2021)
- **Documentation:** [MediaPipe Pose Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker)
- **Downloaded from:** https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task
- **License:** [Apache License 2.0](../mediapipe/LICENSE)
