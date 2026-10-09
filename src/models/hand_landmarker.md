# hand_landmarker.task

*Part of the [model notes](README.md) for netnet-machine-learning.*

## At a glance

| | |
|---|---|
| **What it does** | Finds hands in an image and predicts 21 points on each (fingertips, knuckles, wrist), plus whether it's a left or right hand |
| **Used by** | `nn.hands()` |
| **Made by** | Google's MediaPipe team |
| **License** | Apache License 2.0 (free to use, change and share, with credit) |
| **Changed by us?** | No, this is Google's original file |
| **Size** | 7.8 MB |

## What's inside

A `.task` file is MediaPipe's way of packaging a model: it's a **zip file** with a different name. Run `unzip hand_landmarker.task -d hand_landmarker` to unzip it.

```
hand_landmarker.task
  ├─ hand_detector.tflite             (2.3 MB)  step 1: find the palm
  └─ hand_landmarks_detector.tflite   (5.5 MB)  step 2: find the 21 points
```

Each `.tflite` file is a **TensorFlow Lite** model, a common format for models designed to run on phones and laptops rather than big servers. A `.tflite` file holds two things:

- **The structure:** the list of steps (or "layers") that an image passes through, and how they connect
- **The weights:** the learned numbers each step uses. This is most of the file.

You can see both with [Netron](https://netron.app), a free model viewer: drop in either `.tflite` file to see its layers as a flowchart, and click a layer to see its numbers.

## How it works

Finding 21 points on a hand anywhere in a big video frame is hard, so the work is split into two simpler jobs, one for each model:

1. **The palm detector** looks at the whole image, shrunk to 192 × 192 pixels, and answers *"where are the hands?"* with a box around each palm. (Palms are easier to spot than whole hands, because fingers bend into so many shapes.)
2. **The landmark model** looks only at the cropped area around one hand, at 224 × 224 pixels, and predicts:
   - the 21 points (`landmarks`)
   - the same points as 3D positions in meters (`world landmarks`)
   - whether it's a left or right hand (`handedness`)
   - how sure it is that there's a hand there at all (a "presence score")

MediaPipe's code connects the two. With video, it usually doesn't need to run step 1 every frame: once it has found a hand, it uses where the hand was in the last frame to decide where to look next, and only goes back to the palm detector when it loses track. That's part of why it runs so quickly.

The output names `landmarks`, `world landmarks` and `handedness` are written inside the model file itself. They're the same data you get from `hands.detect()` and `hands.results`.

## By the numbers

The weights are stored as 16-bit numbers (2 bytes each), so the file sizes give a rough count:

- **Palm detector:** about **1.2 million** numbers
- **Landmark model:** about **2.7 million** numbers
- **Together:** roughly **4 million** numbers

(These are estimates: the files also contain the structure, not only weights.) That sounds like a lot, but it's tiny for a modern model. Large language models have billions of numbers, thousands of times more. This one was designed to be small enough to run on a phone, many times per second.

## Who made it, and why

The model was made by Google's MediaPipe team (Google's model card links to their March 2020 announcement). MediaPipe is Google's free, open-source toolkit for running machine learning on everyday devices (phones, laptops, browsers) rather than on servers.

According to Google's model card, it was made for **augmented reality (AR) apps, gesture recognition and hand control** on smartphones, "for research and entertainment purposes." Google released it for free under an open license, so anyone, including us, can use and share it.

## How it learned

A model like this learns from examples: many images of hands where people have marked where each of the 21 points are. During training, the model's numbers are adjusted, little by little, until its guesses match those marks.

According to Google's model card:

- It was trained on images that include **consented images** of hands, captured by people using a smartphone AR app, on many kinds of phone cameras, in real-world light and motion.
- The **3D information** (the `z` values and `world landmarks`) came partly from **synthetic data**: a 3D computer model of the human body (called GHUM), rather than real measurements.
- Google describes it as "trained on limited datasets and… meant for experimental usage."

The model card doesn't say how many images were used, or who the people in them were.

## Limits and fairness

From Google's model card:

- **Not designed for:** hands in gloves, hands holding objects, or hands decorated with jewelry, tattoos or henna. It can also struggle in low light or with motion blur.
- **Explicitly not for:** "any form of surveillance or identity recognition." It finds hand *shapes*; it doesn't know *whose* hand it is.
- **Fairness testing:** Google measured its accuracy on hands from 14 world regions, 6 skin tones (from lightest to darkest, on a scale called Fitzpatrick) and 2 genders. Accuracy varied between groups. For skin tone, the error was highest for the darkest skin tone tested, followed by the lightest. Google reports that it "didn't find any error pattern" related to region, skin tone or gender.

## Things to think about

- The people who made this model decided what counts as "a hand" and where its 21 points are. What kinds of hands might not fit that idea?
- Google tested for fairness and published the results. Look at the skin tone numbers in the model card. Would you call the differences small? Who gets to decide?
- The model runs entirely on your computer. How would you feel about a hand tracker that sent your camera video to a company's servers instead?

## Sources

- **Google's model card:** [MediaPipe Hands (Lite/Full)](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Hand%20Tracking%20(Lite_Full)%20with%20Fairness%20Oct%202021.pdf) (October 2021)
- **Documentation:** [MediaPipe Hand Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker)
- **Downloaded from:** https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
- **License:** [Apache License 2.0](../mediapipe/LICENSE)
