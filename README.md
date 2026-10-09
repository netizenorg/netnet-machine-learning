# netnet-machine-learning

![under construction](https://netnet.studio/images/under-construction/1.gif)

A library of machine learning modules that extends the [netnet-standard-library](https://github.com/netizenorg/netnet-standard-library) (`nn`).

It adds functions like `nn.hands()` to `nn`, so you can bring machine learning models into your creative coding projects with the same friendly style as the rest of `nn`. Everything runs **in your browser, on your own computer**: no accounts, no API keys, and no data sent anywhere.

> **IMPORTANT CLARIFICATION**: netnet itself, the AI-TA at the center of https://netnet.studio, is a "classical" AI: everything it says and does was written by people. This library is different: it's for working with **machine learning** models, the sort of AI whose behavior was learned from data.

## What's included

| Function | What it does | Docs |
|---|---|---|
| `nn.hands()` | Tracks hands in a video: 21 points per hand, plus left/right | [docs/hands.md](docs/hands.md) |

More are on the way, including face and body tracking.

## Quick start

```html
<script src="https://cdn.jsdelivr.net/gh/netizenorg/netnet-standard-library@1.0.1/build/nn.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/netizenorg/netnet-machine-learning@0.1.0/src/nn-mediapipe.js"></script>
<script>
  async function setup () {
    const video = nn.create('video')
      .set({ autoplay: true, muted: true, stream: await nn.askFor('video') })
      .addTo('body')

    const hands = await nn.hands()

    function update () {
      requestAnimationFrame(update)
      const found = hands.detect(video)
      if (found[0]) console.log(found[0][8]) // the first hand's index fingertip
    }
    update()
  }
  nn.on('load', setup)
</script>
```

See [docs/hands.md](docs/hands.md) for a full walkthrough, and the [examples](examples/) folder for more.


## Working offline

Everything this library needs is in the `src` folder. Download it, put it next to your HTML file, and load `src/nn-mediapipe.js` instead of the CDN link. Your project will then work with no internet connection at all.

Keep in mind, as with any project that loads files via JavaScript, even though you don't need internet, your page still needs to be served by a server (`http://` or `https://`), not opened as a local file (`file://`).

Large files only get loaded when they're used: including the script costs almost nothing, and a model only loads the first time you call its function (like `nn.hands()`).

## Why this library includes copies of other people's work

This library builds on machine learning tools and models made by others. Rather than linking to their copies, we include our own in the `src` folder. Here's why:

1. **An easier way in.** Each module (like `nn.hands()`) hides the setup so you can focus on your ideas, while keeping the model's full output, and the underlying tools, available when you want them.
2. **100% local projects.** Everything a module needs is in `src`, so you can build machine learning projects that run offline and don't depend on any company's servers.
3. **Privacy.** Before including anyone else's code, we check it for anything that contacts outside servers, and remove it, so the library follows the [netnet.studio](https://netnet.studio) privacy policy. The models themselves always run on your own computer.
4. **Stability.** We use fixed versions, so your projects won't break when the original makers update, move or remove their files.
5. **Credit and transparency.** We didn't train these models. Each folder in `src` has its own README saying where its files came from, their license, and exactly what (if anything) we changed. Each model also has notes on who made it, why, how it was trained, and its limits.

## Credits and licenses

- **This library** (`src/nn-mediapipe.js`, docs and examples): [GPL-3.0](LICENSE), by [netizen.org](https://netizen.org).
- **MediaPipe** (`src/mediapipe/`): by Google, [Apache License 2.0](src/mediapipe/LICENSE). One modification (the usage logger removed), documented in [src/mediapipe/README.md](src/mediapipe/README.md).
- **Models** (`src/models/`): by Google's MediaPipe team, Apache License 2.0, unmodified. Each model has its own notes (where it came from, how it works, its limits, and links to Google's model cards), indexed in [src/models/README.md](src/models/README.md).
