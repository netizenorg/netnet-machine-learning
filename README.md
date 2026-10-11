# netnet-machine-learning

![under construction](https://netnet.studio/images/under-construction/1.gif)

A library of machine learning modules that extends the [netnet-standard-library](https://github.com/netizenorg/netnet-standard-library) (`nn`).

It adds functions like `nn.hands()` to `nn`, so you can bring machine learning models into your creative coding projects with the same friendly style as the rest of `nn`. Everything runs **in your browser, on your own computer**: no accounts, no API keys, and no data sent anywhere. The one exception is `nn.prompt()`, for talking to language models: it only contacts a server when you call it, and only the one you choose (a model on your own computer, or a company's API).

> **IMPORTANT CLARIFICATION**: netnet itself, ◕ ◞ ◕ the AI-TA at the center of https://netnet.studio, is a "classical" AI: everything it says and does was written by people. This library is different: it's for working with **machine learning** models, the sort of AI whose behavior was learned from data.

## What's included

| Function | What it does | Docs |
|---|---|---|
| `nn.hands()` | Tracks hands in a video: 21 points per hand, plus left/right | [docs/hands.md](docs/hands.md) |
| `nn.face()` | Tracks faces in a video: 478 points per face, plus expressions | [docs/face.md](docs/face.md) |
| `nn.pose()` | Tracks a body in a video: 33 points, from face to feet | [docs/pose.md](docs/pose.md) |
| `nn.prompt()` | Sends prompts to language models (on your own computer with Ollama, or Gemini, OpenAI and Anthropic's APIs), and to other AI models with a web API | [docs/prompt.md](docs/prompt.md) |

More are on the way.

## Quick start

```html
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
        .scale(-1, 1)
        .addTo('body')

      flame = nn.create('div')
        .content('🔥')
        .addTo('body')
        .positionOrigin('center')
        .css('font-size', 48)

      // 1️⃣ LOAD THE MODEL
      hands = await nn.hands()
    }

    function animate () {
      requestAnimationFrame(animate)
      if (!hands) return

      // 2️⃣ USE MODEL TO DETECT HANDS IN VIDEO
      const found = hands.detect(video, { mirror: true })
      const hand = found[0] // the first hand it sees (if any)
      if (!hand) return

      // 3️⃣ MAKE USE OF MODEL'S PREDICTIONS
      const fingerTip = hand[8]
      flame.position(fingerTip.x, fingerTip.y)
    }

    nn.on('load', setup)
    nn.on('load', animate)
</script>
```

Try this sketch out on [netnet.studio](https://netnet.studio/?layout=dock-left#code/eJydVMtu2zAQvPsrtrmIRmU9YqexgyRIL7kWKHoLeqDJlc1GIlWSSuMG+Yvee+r/9RO61MtR2lMBA7Z2Z2dnd1a+dMKq2oOz4upk733tLtJUSJ18cRJL9WATjT7d7VP6Ut9RG7sLP+mzcJ5rya1clGpruT3c5EmW5Om2UaVMtU4qFVhOri/Trsf17PL/m1Vc7JXGRYncaqV3NygQN0uxXuJyJYXM8CzP1mdbfr7aLjfn8hTfnZ5tNptlSs1IzaJCqXitavy3pusZQIkeHpREE8OeRnMxFCWvcEYp7g5aQNFo4ZXR4NA3NbA5PFEOuiK4AhpaWOQeWdSGonmbBkiogD31D8TWeFOX/HAB3jYYj/Gq8ShfBwPQKV3S9K9TzlO36gL4N6586M7d/a2xr7s/H2UIXiJb5DHkc0hTqJS1xoLyMZTqHoHTZGWhEATNbflQxqX8ZFi0NfJApG203cx0ZKkejgMLoz1qz6LfP3/8OoanTH2wNk6FtX6waqc0iwQVon3B5RyLCiJcOLqKKIbVesyZmgvlDyx7qSuR3PNk3wSB2axLtI7S87irNsDaNZSGS/B7hMrQHRL8OdSMbnOtKprw6LfFrw06/76NE+LWUlPWwzppqgD2pm0xJ7hvrO5k0F6ch8I0WpKYFpBI9Cg860/vqXelM3swr6sLeCpry++yz0F7kF0oOyRpNofogJEArg/9VoKakB4GGPi8qnsVd+uWTWmJj8Snd2gp2YO7pQ6rzueT8OAeI3zyGAfO5DCFjHa8vYI8m6Qo+tH4cD9TaEfwDFg6HEVPdWQ9ZvCLPCUVUTCTbqR9Red/hUeTjv8AfwBpK4eC). See [docs/hands.md](docs/hands.md) for a full walkthrough, and the [examples](examples/) folder for more.


## Working offline

Everything this library needs is in the `src` folder. Download it, put it next to your HTML file, and load `src/nn-mediapipe.js` instead of the CDN link. Your project will then work with no internet connection at all.

Keep in mind, as with any project that loads files via JavaScript, even though you don't need internet, your page still needs to be served by a server (`http://` or `https://`), not opened as a local file (`file://`).

Large files only get loaded when they're used: including the script costs almost nothing, and a model only loads the first time you call its function (like `nn.hands()`).

## Why everything is included in `src`

This library builds on open-source machine learning tools and models. Instead of loading them as external dependencies (files your project would fetch from someone else's servers every time it runs), we include everything a module needs in the `src` folder. Here's why:

1. **An easier way in.** Each module (like `nn.hands()`) hides the setup so you can focus on your ideas, while keeping the model's full output, and the underlying tools, available when you want them.
2. **100% local projects.** Everything a module needs is in `src`, so you can build machine learning projects that run offline and don't depend on any company's servers.
3. **Privacy.** Before including anyone else's code, we check it for anything that contacts outside servers, and remove it, so the library follows the [netnet.studio](https://netnet.studio) privacy policy. The models themselves always run on your own computer.
4. **Stability.** We use fixed versions, so your projects won't break when the original makers update, move or remove their files.
5. **Credit and transparency.** We didn't train these models. Each folder in `src` has its own README saying where its files came from, their license, and exactly what (if anything) we changed. Each model also has notes on who made it, why, how it was trained, and its limits.

## Credits, licenses and shout-outs

- **This library** (`src/nn-mediapipe.js`, docs and examples): [GPL-3.0](LICENSE), by [netizen.org](https://netizen.org).
- **MediaPipe** (`src/mediapipe/`): by Google, [Apache License 2.0](src/mediapipe/LICENSE). One modification (the usage logger removed), documented in [src/mediapipe/README.md](src/mediapipe/README.md).
- **Models** (`src/models/`): by Google's MediaPipe team, Apache License 2.0, unmodified. Each model has its own notes (where it came from, how it works, its limits, and links to Google's model cards), indexed in [src/models/README.md](src/models/README.md).

We're inspired by other projects that have worked to make machine learning models like these accessible to artists and beginners, especially [handsfree.js](https://github.com/dDab-panda/handsfree), [magenta.js](https://github.com/magenta/magenta-js) and [ml5](https://github.com/ml5js).
