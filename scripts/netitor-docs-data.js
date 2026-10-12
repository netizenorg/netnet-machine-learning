// The short explanations netnet.studio's code editor (netitor) shows when you
// double-click one of this library's functions. `npm run netitor-docs` turns
// this list into nn-ml-netitor-docs.json, next to this file (see compile-netitor-docs.js).
//
// Each entry:
//   namespace: 'nn' for functions on nn itself (ex: nn.hands), or the name of
//              a group of methods/properties on an object one of them returns
//              (ex: 'nnTracker' for hands.detect(), the tracker nn.hands() returns)
//   name:      the function or property name, without the object (ex: 'detect')
//   url:       the docs page (and section) to link to
//   friendly:  a short, high level explanation for students (a few sentences,
//              go easy on <code>). it can use HTML, or markdown `code` and [links](url)

const DOCS = 'https://github.com/netizenorg/netnet-machine-learning/blob/main/docs/'

// reminder added to each nn.* function, since they only exist when the
// extension's <script> tag is loaded after nn's
const EXTENSION = 'This method comes from the [netnet-machine-learning](https://github.com/netizenorg/netnet-machine-learning) extension, so it only works if you load its script after nn\'s.'

module.exports = [

  // ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ nn
  // added by nn-mediapipe.js and nn-prompt.js

  {
    namespace: 'nn',
    name: 'hands',
    url: DOCS + 'hands.md',
    friendly: 'This method loads a machine learning model that finds hands in a video, giving you the position of 21 points on each hand (fingertips, knuckles and wrist). The model runs in your browser, so your video is never sent anywhere. ' + EXTENSION
  },

  {
    namespace: 'nn',
    name: 'face',
    url: DOCS + 'face.md',
    friendly: 'This method loads a machine learning model that finds faces in a video, giving you the position of 478 points on each face, and optionally scores for its expression (like a smile or an open mouth). The model runs in your browser, so your video is never sent anywhere. ' + EXTENSION
  },

  {
    namespace: 'nn',
    name: 'pose',
    url: DOCS + 'pose.md',
    friendly: 'This method loads a machine learning model that finds a body in a video, giving you the position of 33 points from face to feet. The model runs in your browser, so your video is never sent anywhere. ' + EXTENSION
  },

  {
    namespace: 'nn',
    name: 'prompt',
    url: DOCS + 'prompt.md',
    friendly: 'This method sends a message to a large language model (LLM) and gives you its reply. The model can run locally on your own computer (with Ollama or another local provider), or in the cloud (with Gemini, Anthropic or OpenAI, using your own API key). ' + EXTENSION
  },

  // ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ nnTracker
  // the tracker returned by nn.hands(), nn.face() and nn.pose()

  {
    namespace: 'nnTracker',
    name: 'detect',
    url: DOCS + 'hands.md#how-it-works',
    friendly: 'This method runs the model on the current frame of a video and returns what it found (hands, faces or bodies), each as a list of points on the page. Call it every frame, inside your animation loop.'
  },

  {
    namespace: 'nnTracker',
    name: 'results',
    url: DOCS + 'hands.md#going-further',
    friendly: 'The full, raw output from the model you loaded with `nn.hands()`, `nn.face()` or `nn.pose()`, for the latest frame it looked at. It includes extras that detect() leaves out, like how confident the model is about what it found.'
  },

  {
    namespace: 'nnTracker',
    name: 'raw',
    url: DOCS + 'hands.md#going-further',
    friendly: 'The object from MediaPipe (Google\'s library that runs the model) behind the tracker you loaded with `nn.hands()`, `nn.face()` or `nn.pose()`. It\'s there for advanced uses this extension doesn\'t cover.'
  },

  // ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ nnPromptReply
  // the reply returned by nn.prompt()

  {
    namespace: 'nnPromptReply',
    name: 'text',
    url: DOCS + 'prompt.md#what-you-get-back',
    friendly: 'The text portion of the reply which came from the model you prompted with `nn.prompt()`.'
  },

  {
    namespace: 'nnPromptReply',
    name: 'data',
    url: DOCS + 'prompt.md#json-replies-schemas',
    friendly: 'The reply from the model you prompted with `nn.prompt()`, as data (an object or array) rather than text. This is only there if you asked for a reply in a specific format, using a schema.'
  },

  {
    namespace: 'nnPromptReply',
    name: 'request',
    url: DOCS + 'prompt.md#what-you-get-back',
    friendly: 'Exactly what `nn.prompt()` sent to the model\'s server, with your API key hidden. Log it to the console to see what\'s really being sent behind the scenes.'
  },

  {
    namespace: 'nnPromptReply',
    name: 'raw',
    url: DOCS + 'prompt.md#what-you-get-back',
    friendly: 'The full, unedited response from the server of the model you prompted with `nn.prompt()`, before the text was picked out of it. Log it to the console to see everything that came back.'
  },

  {
    namespace: 'nnPromptReply',
    name: 'status',
    url: DOCS + 'prompt.md#what-you-get-back',
    friendly: 'The HTTP status code the model\'s server sent back when you used `nn.prompt()`: a number that says how the request went. 200 means everything went OK.'
  }
]
