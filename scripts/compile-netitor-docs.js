/*
  ⚠️ THIS SCRIPT IS AI GENERATED (Anthropic Claude Opus 5.5), adapted from
  netnet-standard-library's scripts/compile-netitor-docs.js (also AI generated)
  ⚠️ SPOT CHECK THE RESULTS EVERY TIME IT RUNS
*/

// Compiles scripts/netitor-docs-data.js into scripts/nn-ml-netitor-docs.json,
// for netitor's (netnet.studio's code editor) contextual education tooltips.
// It's the same format as netnet-standard-library's nn-netitor-docs.json, so
// netitor can merge the two files:
//
// {
//   "nn":            { "hands": { status, url, keyword, description }, ... },
//   "nnTracker":     { "detect": { ... }, ... },
//   "nnPromptReply": { "text": { ... }, ... }
// }
//
// keyword.html     — <a> tag linking to the docs page
// keyword.text     — plain name string
// description.html — friendly text with markdown backticks → <code>, links preserved
// description.text — plain text version (HTML tags stripped)

const fs = require('fs')
const path = require('path')

const OUT_FILE = path.join(__dirname, 'nn-ml-netitor-docs.json')

// Convert markdown backtick code spans and [text](url) links to HTML.
// Existing HTML tags (like <code>, <a>) are left untouched.
function md2html (str) {
  if (!str) return ''
  return str
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

// Strip all HTML tags and decode common HTML entities to produce plain text
function html2text (str) {
  if (!str) return ''
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

// Build the compiled entry object from a docs entry
function buildEntry (entry) {
  const friendlyHtml = md2html(entry.friendly)
  return {
    status: 'standard',
    url: entry.url,
    keyword: {
      html: `<a href="${entry.url}" target="_blank">${entry.name}</a>`,
      text: entry.name
    },
    description: {
      html: friendlyHtml,
      text: html2text(friendlyHtml)
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const entries = require('./netitor-docs-data.js')
const output = {}

for (const entry of entries) {
  for (const field of ['namespace', 'name', 'url', 'friendly']) {
    if (!entry[field]) throw new Error(`netitor-docs-data.js: an entry is missing its "${field}": ${JSON.stringify(entry)}`)
  }
  if (!output[entry.namespace]) output[entry.namespace] = {}
  if (output[entry.namespace][entry.name]) {
    throw new Error(`netitor-docs-data.js: "${entry.namespace}.${entry.name}" is listed twice`)
  }
  output[entry.namespace][entry.name] = buildEntry(entry)
}

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n')

// Summary
const total = Object.values(output).reduce((n, ns) => n + Object.keys(ns).length, 0)
console.log(`Wrote ${OUT_FILE}`)
console.log(`  ${total} entries across ${Object.keys(output).length} namespaces:`)
for (const [ns, list] of Object.entries(output)) {
  console.log(`  ${ns}: ${Object.keys(list).join(', ')}`)
}
