# Models

The files in this folder are trained machine learning models. A model isn't a program: it's a file full of numbers (often called **weights** or **parameters**) that were learned from data. The code in `../mediapipe/` reads those numbers and uses them to turn an image into an answer, like "there's a hand here, and these are its fingertips."

These models were made by other people. To be transparent about where they came from and how they work, each one has its own notes file, following the same format:

- **At a glance:** what it does, who made it, and where it came from
- **What's inside:** what's actually in the file
- **How it works:** what happens when you call `detect()`
- **By the numbers:** how big it is
- **Who made it, and why**
- **How it learned:** what data it was trained on
- **Limits and fairness:** what it's not good at, and who it may work less well for
- **Things to think about:** questions for discussion
- **Sources**

## Index

| Model file | What it does | Used by | Made by | Notes |
|---|---|---|---|---|
| `hand_landmarker.task` | Finds hands and 21 points on each | `nn.hands()` | Google (MediaPipe) | [hand_landmarker.md](hand_landmarker.md) |
