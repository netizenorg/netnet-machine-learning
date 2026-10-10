# nn.prompt: getting started

`nn.prompt()` sends a prompt to a language model and gives you its reply, without the fiddly parts of web requests (headers, keys, formats). It works with models running on your own computer (through [Ollama](https://ollama.com)) and with companies' APIs (Google Gemini, OpenAI, Anthropic), and it can talk to other AI models that have a web API too.

**This is the one part of this library that contacts a server.** The rest runs entirely in your browser. `nn.prompt()` only sends something when your code calls it, and only to the server you choose. With a company's API, your prompts go to that company and are handled according to their terms. With Ollama, everything stays on your computer.

## Setup

```html
<script src="https://cdn.jsdelivr.net/gh/netizenorg/netnet-standard-library@1.0.1/build/nn.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/netizenorg/netnet-machine-learning@0.1.0/src/nn-prompt.js"></script>
```

## Hello World

```js
async function setup () {
  const reply = await nn.prompt({
    provider: 'gemini',
    key: 'PASTE-YOUR-API-KEY-HERE', // keep keys out of code you share or publish!
    model: 'gemini-3.5-flash-lite',
    message: 'write a haiku about hands'
  })
  console.log(reply.text)
}

nn.on('load', setup)
```

`nn.prompt()` takes a moment (the model has to write its reply), so it needs `await`.

This is the same as `examples/prompt-simple.html`, which adds a text box and a button. For a more playful single-prompt example, see `examples/prompt-explode.html`: like Lupe Fiasco + Google's TextFX, it guides the model with a few examples in the prompt, then asks it to continue the pattern.

## Providers

| `provider` | Where the model runs | Key? | Models |
|---|---|---|---|
| `'ollama'` | your own computer | no | whichever you've downloaded in Ollama |
| `'gemini'` | Google's servers | yes, [free to start](https://aistudio.google.com/apikey) | [Gemini models](https://ai.google.dev/gemini-api/docs/models) |
| `'openai'` | OpenAI's servers | yes, paid | [OpenAI models](https://developers.openai.com/api/docs/models) |
| `'anthropic'` | Anthropic's servers | yes, paid | [Claude models](https://docs.anthropic.com/en/docs/about-claude/models) |
| `'generic'` | any server that uses the common format (pass its `url`) | depends on the server | depends on the server |

You always choose the `model`. Companies rename and retire models often, so check their list if one stops working.

## Conversations

Language models don't remember anything. To have a conversation, you send the whole conversation every time. Keep it in an array (it's yours: you can change it, trim it, or save it), and pass it as `messages`:

```js
let history = []

async function chat (text) {
  history.push({ role: 'user', content: text })

  const reply = await nn.prompt({
    provider: 'gemini',
    key: KEY,
    model: 'gemini-3.5-flash-lite',
    system: 'You are a friendly assistant. Keep your answers short.',
    messages: history
  })

  history.push({ role: 'model', content: reply.text })
  return reply.text
}
```

Every message is `{ role, content }`, where `role` is `'user'` (you) or `'model'` (the model). `nn.prompt()` translates this into each provider's own format for you: most providers call the model's role `'assistant'`, and Gemini calls it `'model'`. (If you copy an example that uses `'assistant'`, that works too.) See `examples/prompt-chat.html`.

## Options

| Option | What it does |
|---|---|
| `provider` | `'gemini'`, `'openai'`, `'anthropic'`, `'ollama'` or `'generic'` |
| `model` | Which model to use (required with a `provider`) |
| `key` | Your API key (not needed for Ollama) |
| `message` | Some text to send (for a single prompt) |
| `messages` | The whole conversation, as an array of `{ role, content }` (use this *or* `message`) |
| `system` | A "system prompt": instructions the model should follow, like its role or tone |
| `temperature` | How random the replies are: around `0` is predictable, higher is more surprising (see the note below) |
| `schema` | Ask for a reply in a specific JSON format (see below) |
| `url` | Send the request somewhere else (see "Other servers" below) |
| `headers` | Extra HTTP headers |
| `method` | The HTTP method. You usually don't need this: it's `'POST'` when there's something to send, and `'GET'` when there isn't |
| `body` | Extra request settings whose names clash with the ones above (see below) |

**Any other property you add is included in the request**, so you can use any setting your provider (or other API) offers. See "Adding other settings" below.

**About temperature:** a language model writes one small piece of text at a time (a "token": a word or part of a word). For each token, it gives every possible next token a score, and those scores are turned into probabilities: for "the cat sat on the ___", maybe *mat* 70%, *floor* 20%, *moon* 1% (made-up numbers). Then one token is picked at random, weighted by those probabilities. Temperature changes the probabilities before the pick: a **low** temperature exaggerates the differences, so the likeliest tokens win almost every time (around `0`, it nearly always picks the top one, and the same prompt gives nearly the same reply); a **high** temperature evens them out, so unlikely tokens like *moon* get picked more often, for more surprising (and less reliable) replies. The allowed range depends on the provider: `0` to `1` for Anthropic, `0` to `2` for Gemini and OpenAI.

Some newer models don't allow changing temperature, and reply with an error if you try. At the time of writing, this includes Anthropic's newest Claude models (Claude Haiku 4.5 and Sonnet 4.6 still allow it) and some of OpenAI's reasoning models. If you get an error mentioning temperature, try a different model or leave `temperature` out.

## What you get back

```js
reply.text      // the model's reply, as text
reply.data      // the reply as data, if you used a schema
reply.request   // exactly what was sent: { url, method, headers, body } (your key is hidden)
reply.raw       // the provider's full response
reply.status    // the HTTP status code (200 means OK)
```

`reply.request` and `reply.raw` are worth a look (`console.log` them): they show what's really being sent to and from the model's API.

If something goes wrong, `nn.prompt()` throws an error with the provider's message, so wrap it in `try/catch` if you want to handle errors yourself:

```js
try {
  const reply = await nn.prompt({ ... })
} catch (err) {
  console.log(err.message) // ex: "( ◕ ◞ ◕ ) nn-prompt: 503 from ...: The model is overloaded"
}
```

## JSON replies (schemas)

A schema describes the exact shape of data you want back, using [JSON Schema](https://json-schema.org). The provider makes the model reply in that shape, and you get it as data in `reply.data`:

```js
const reply = await nn.prompt({
  provider: 'gemini',
  key: KEY,
  model: 'gemini-3.5-flash-lite',
  message: 'invent a creature that lives in a sketchbook',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      color: { type: 'string' },
      legs: { type: 'number' }
    },
    required: ['name', 'color', 'legs'],
    additionalProperties: false
  }
})

console.log(reply.data.name, reply.data.legs)
```

Tips:
- OpenAI is strict: list **every** property in `required`, and include `additionalProperties: false` (as above). Doing the same for other providers keeps your schema working everywhere.
- Smaller models (especially ones running on your own computer) don't always follow schemas well. If `reply.data` is missing, look at `reply.text` to see what came back.

## Adding other settings

Each provider has many more settings than the options above. Add them as extra properties, using the provider's own names, and they're included in the request:

```js
await nn.prompt({
  provider: 'openai',
  key: KEY,
  model: 'gpt-5.4-mini',
  message: 'hi',
  top_p: 0.9 // an OpenAI setting, added to the request as is
})
```

Some providers group their settings. Gemini, for example, keeps most of them inside `generationConfig`, so you'd write `generationConfig: { topK: 40 }`. Look at `reply.request.body` to see the final request.

**Name clashes:** if a setting has the same name as one of `nn.prompt()`'s own options (like `url` or `model`), put it inside `body` instead, and it'll be added to the request without being treated as an option:

```js
body: { url: 'https://example.com/photo.jpg' } // sent as part of the request
```

## Other servers

### The generic provider

Many tools for running models on your own computer (and some other services) all accept requests in the same format. It's the format OpenAI created for its API, which so many others copied that it became a common standard. To use one of these, choose `provider: 'generic'` and pass the server's `url`:

```js
await nn.prompt({
  provider: 'generic',
  url: 'http://localhost:1234/v1/chat/completions',
  model: 'my-local-model',
  message: 'hi'
})
```

The server's own documentation will tell you its address (often ending in `/v1/chat/completions`), its model names, and whether it needs a `key`.

### A provider at a different address

`url` also works with the other providers. For example, for Ollama running on another computer on your network: `provider: 'ollama', url: 'http://192.168.1.20:11434/api/chat'`.

### Any web API

To talk to any other model with a web API (image generators, speech, embeddings, and so on), leave out `provider`. Then everything except `url`, `key`, `headers`, `method` and `body` is sent as the request, exactly as you wrote it, in whatever format that API expects:

```js
const reply = await nn.prompt({
  url: 'http://localhost:7860/generate',
  prompt: 'a cat made of clouds',
  steps: 20
})
console.log(reply.raw) // the response, in whatever form the API sends it
```

- **Reading data:** with nothing to send, the request is a `GET`. For example, the models you've downloaded in Ollama: `nn.prompt({ url: 'http://localhost:11434/api/tags' })`. If you choose `method: 'GET'` and add properties, they're added to the URL (`?prompt=cat&steps=20`), which is how many APIs take their inputs.
- **Keys:** a `key` is sent the most common way (`Authorization: Bearer <key>`). If the API expects something else, use `headers` instead.
- **Files:** to upload a file (like a recording for a speech-to-text model), pass a `FormData` or `Blob` as `body`, and it's sent as it is.
- **Responses** come back in `reply.raw` as data (for JSON), text, or a `Blob` (for images, audio and other files). To show an image: `nn.create('img').set('src', URL.createObjectURL(reply.raw))`.

## Keep your keys safe

Your API key is like a password, and with paid providers, anyone who has it can spend your money.

- Never put a real key in code you share, publish or put on GitHub.
- For sketches you share, have people paste their own key into an input instead:
  ```js
  const keyInput = nn.create('input')
    .set('type', 'password')
    .set('placeholder', 'Your API key')
    .addTo('body')

  // then use it like this...
  nn.prompt({
    key: keyInput.value
    // ...wither other properties here
  })
  ```

## Troubleshooting

- **"couldn't reach..." with Ollama:** make sure Ollama is running. Ollama also has to allow requests from web pages (its `OLLAMA_ORIGINS` setting). Some browsers (like Chrome) block secure (`https://`) websites from talking to servers on your own computer; if that happens, try Firefox, or a page served from `http://localhost`.
- **401 or 403:** your key is missing or wrong.
- **404 with a model name:** that model doesn't exist (anymore). Check the provider's model list.
- **429 or 503:** too many requests, or the model is busy. Wait a moment and try again.
- **`reply.text` is empty:** look at `reply.raw`. The provider may have blocked the request or reply (for example, for safety reasons), and the response will usually say why.
