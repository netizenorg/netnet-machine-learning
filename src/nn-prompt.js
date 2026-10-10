/*
  nn-prompt.js
  ------------
  Part of netnet-machine-learning: https://github.com/netizenorg/netnet-machine-learning
  An extension for nn (the netnet standard library) for sending prompts to
  language models (and other AI models) over the web, without the plumbing.

    const reply = await nn.prompt({
      provider: 'gemini',
      key: KEY,
      model: 'gemini-3.5-flash-lite',
      message: 'write a haiku about hands'
    })
    reply.text      // the model's reply
    reply.request   // exactly what was sent (with your key hidden)
    reply.raw       // the full response

  Unlike the rest of this library, this DOES contact a server: only when you
  call it, and only the one you choose (a model running on your own computer,
  like Ollama, or a company's API, with your own key). See docs/prompt.md
*/
(function () {
  'use strict'

  if (!window.nn) {
    console.error('( ◕ ◞ ◕ ) nn-prompt: load nn.min.js before this file')
    return
  }

  // Each provider's API: where requests go, how to send the key, and how to
  // translate our simple message format into theirs (and the reply back).
  // These are all "stateless" APIs: every request includes the whole
  // conversation, so the conversation stays in your hands.
  const PROVIDERS = {
    gemini: {
      url: (o) => `https://generativelanguage.googleapis.com/v1beta/models/${o.model}:generateContent`,
      headers: (key) => ({ 'x-goog-api-key': key }),
      body: (o) => {
        const body = {
          // Gemini also calls the model's role 'model', and wraps text in "parts"
          contents: o.messages.map(m => ({
            role: m.role === 'model' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        }
        if (o.system) body.systemInstruction = { parts: [{ text: o.system }] }
        const config = {}
        if (o.temperature !== undefined) config.temperature = o.temperature
        if (o.schema) {
          config.responseMimeType = 'application/json'
          config.responseJsonSchema = o.schema
        }
        if (Object.keys(config).length > 0) body.generationConfig = config
        return body
      },
      text: (data) => (data.candidates?.[0]?.content?.parts || [])
        .filter(p => p.text && !p.thought)
        .map(p => p.text)
        .join('')
    },

    openai: {
      url: () => 'https://api.openai.com/v1/chat/completions',
      headers: (key) => ({ Authorization: `Bearer ${key}` }),
      body: (o) => {
        const body = { model: o.model, messages: withSystem(o) }
        if (o.temperature !== undefined) body.temperature = o.temperature
        if (o.schema) {
          body.response_format = {
            type: 'json_schema',
            json_schema: { name: 'response', schema: o.schema, strict: true }
          }
        }
        return body
      },
      text: (data) => data.choices?.[0]?.message?.content ?? ''
    },

    anthropic: {
      url: () => 'https://api.anthropic.com/v1/messages',
      headers: (key) => ({
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true' // allows requests from a web page
      }),
      body: (o) => {
        const body = { model: o.model, messages: o.messages, max_tokens: 4096 }
        if (o.system) body.system = o.system
        if (o.temperature !== undefined) body.temperature = o.temperature
        if (o.schema) body.output_config = { format: { type: 'json_schema', schema: o.schema } }
        return body
      },
      text: (data) => (data.content || [])
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('')
    },

    ollama: {
      url: () => 'http://localhost:11434/api/chat',
      headers: () => ({}),
      body: (o) => {
        const body = { model: o.model, messages: withSystem(o), stream: false }
        if (o.temperature !== undefined) body.options = { temperature: o.temperature }
        if (o.schema) body.format = o.schema
        return body
      },
      text: (data) => data.message?.content ?? ''
    }
  }

  // the format OpenAI created for its API, which many other tools copied
  // (especially ones for running models on your own computer), so it works
  // with lots of servers: you just need to pass their url
  PROVIDERS.generic = {
    url: () => null,
    headers: PROVIDERS.openai.headers,
    body: PROVIDERS.openai.body,
    text: PROVIDERS.openai.text
  }

  // OpenAI and Ollama put the system prompt at the start of the messages
  function withSystem (o) {
    return o.system ? [{ role: 'system', content: o.system }, ...o.messages] : o.messages
  }

  // in our messages, the model's role is 'model' (or 'assistant', which we
  // also accept). most providers call it 'assistant', so we translate it
  function modelRoleAs (messages, word) {
    return messages.map(m => {
      const isModel = m.role === 'model' || m.role === 'assistant'
      return isModel ? { ...m, role: word } : m
    })
  }

  function error (msg, details) {
    return Object.assign(new Error(`( ◕ ◞ ◕ ) nn-prompt: ${msg}`), details)
  }

  // adds the properties of extra into target (going inside nested objects)
  function merge (target, extra) {
    for (const k in extra) {
      const a = target[k]
      const b = extra[k]
      const bothObjects = a && b && typeof a === 'object' && typeof b === 'object' &&
        !Array.isArray(a) && !Array.isArray(b)
      target[k] = bothObjects ? merge({ ...a }, b) : b
    }
    return target
  }

  // a copy of the headers with the key replaced, so it's safe to log or display
  function hideKey (headers, key) {
    const copy = {}
    for (const k in headers) {
      copy[k] = key ? String(headers[k]).split(key).join('••••••') : headers[k]
    }
    return copy
  }

  // reads a response as JSON, text, or (for images, audio, etc) a Blob
  async function readBody (res) {
    const type = res.headers.get('content-type') || ''
    if (type.includes('json') || type.startsWith('text/') || type === '') {
      const text = await res.text()
      try { return JSON.parse(text) } catch (e) { return text }
    }
    return res.blob()
  }

  // finds the error message in a provider's error response
  function errorMessage (raw) {
    if (typeof raw === 'string') return raw.slice(0, 300)
    if (raw instanceof window.Blob) return 'no details'
    const e = raw?.error
    return e?.message || (typeof e === 'string' ? e : null) || raw?.message ||
      JSON.stringify(raw).slice(0, 300)
  }

  // the option names nn.prompt() uses itself. ANY other property is added to
  // the request (use "body" for a property with one of these names)
  const OWN = ['url', 'method', 'key', 'headers', 'body']
  const PROVIDER_OWN = ['provider', 'model', 'message', 'messages', 'system', 'temperature', 'schema']

  // the properties of obj not in names
  function others (obj, names) {
    const out = {}
    for (const k in obj) {
      if (!names.includes(k) && obj[k] !== undefined) out[k] = obj[k]
    }
    return out
  }

  // data that's sent exactly as it is (not converted to JSON)
  function isRaw (data) {
    return data instanceof window.FormData || data instanceof window.Blob || typeof data === 'string'
  }

  async function prompt (opts = {}) {
    const { provider, key, url, headers = {}, body } = opts
    const p = provider ? PROVIDERS[provider] : null

    if (provider && !p) {
      throw error(`unknown provider '${provider}'. use one of: ${Object.keys(PROVIDERS).join(', ')} (or leave it out and pass a url)`)
    }
    if (!p && !url) {
      throw error('pass a provider (like \'gemini\' or \'ollama\') or a url to send the request to')
    }

    let reqUrl, reqHeaders, data
    if (p) {
      // levels 1 + 2: build the request in this provider's format
      if (!opts.model) {
        throw error('which model? pass one as { model: \'...\' } (see your provider\'s list of models)')
      }
      const messages = opts.messages ||
        (opts.message !== undefined ? [{ role: 'user', content: String(opts.message) }] : null)
      if (!messages) {
        throw error('pass a message (some text) or messages (an array of { role, content })')
      }
      reqUrl = url || p.url(opts)
      if (!reqUrl) {
        throw error(`the '${provider}' provider needs a url: the address of the server you're sending to (ex: 'http://localhost:1234/v1/chat/completions')`)
      }
      reqHeaders = key ? p.headers(key) : {}
      const word = provider === 'gemini' ? 'model' : 'assistant'
      data = p.body({ ...opts, messages: modelRoleAs(messages, word) })
      merge(data, others(opts, [...OWN, ...PROVIDER_OWN]))
      if (body) merge(data, body)
    } else {
      // level 3: any endpoint. every other property is the request's data
      reqUrl = url
      reqHeaders = key ? { Authorization: `Bearer ${key}` } : {}
      if (isRaw(body)) data = body
      else {
        data = merge(others(opts, OWN), body || {})
        if (Object.keys(data).length === 0) data = undefined
      }
    }

    // POST when there's data to send, GET when there isn't (unless you choose)
    const method = (opts.method || (data !== undefined ? 'POST' : 'GET')).toUpperCase()
    const init = { method, headers: { ...reqHeaders, ...headers } }

    if (data !== undefined) {
      if (method === 'GET' || method === 'HEAD') {
        // GET requests can't have a body, so the data goes in the URL instead (?a=1&b=2)
        const u = new URL(reqUrl, document.baseURI)
        for (const k in data) {
          const v = data[k]
          u.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : v)
        }
        reqUrl = u.href
      } else if (isRaw(data)) {
        init.body = data
      } else {
        init.body = JSON.stringify(data)
        init.headers = { 'Content-Type': 'application/json', ...init.headers }
      }
    }

    // what we're sending, safe to look at (the key is hidden)
    const request = { url: reqUrl, method, headers: hideKey(init.headers, key), body: init.body ? data : undefined }

    let res
    try {
      res = await window.fetch(reqUrl, init)
    } catch (err) {
      throw error(`couldn't reach ${reqUrl} (${err.message}). check the URL and your internet connection, or for a model on your own computer, that it's running and accepts requests from web pages`, { request })
    }

    const raw = await readBody(res)
    if (!res.ok) {
      throw error(`${res.status} from ${reqUrl}: ${errorMessage(raw)}`, { request, raw, status: res.status })
    }

    const reply = { request, raw, status: res.status }
    if (p) {
      reply.text = p.text(raw)
      if (opts.schema) {
        try {
          reply.data = JSON.parse(reply.text)
        } catch (err) {
          console.warn('( ◕ ◞ ◕ ) nn-prompt: the reply wasn\'t valid JSON, see reply.text', reply.text)
        }
      }
    }
    return reply
  }

  if (window.nn.prompt) console.warn('( ◕ ◞ ◕ ) nn-prompt: nn.prompt already exists, replacing it')
  window.nn.prompt = prompt
})()
