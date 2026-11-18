#!/usr/bin/env node
/**
 * Translation checker — `npm run i18n:check`
 *
 * 1. Finds every visible English string in src/ that is NOT wrapped in
 *    t(), tp() or msg() (JSX text, text attributes like placeholder/aria-label,
 *    and English sentences anywhere in code).
 * 2. Collects every t()/tp()/msg() key and checks that hi.js and mr.js
 *    translate it, with the same {placeholders}.
 * 3. Reports translations that are no longer used.
 *
 * Exits with code 1 if anything is missing, so it can gate builds/CI.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseAst } from 'rolldown/parseAst'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const SRC = join(ROOT, 'src')
const SKIP_FILES = new Set(['src/i18n/hi.js', 'src/i18n/mr.js', 'src/i18n/core.js', 'src/i18n/rich.jsx'])

// JSX attributes whose string values are shown to people.
const TEXT_ATTRS = new Set([
  'placeholder', 'title', 'alt', 'aria-label', 'label', 'message', 'subtitle', 'hint',
  'confirmLabel', 'cancelLabel', 'submitLabel', 'description', 'text', 'heading', 'error',
])
// JSX attributes that never contain UI text.
const NON_TEXT_ATTRS = new Set([
  'className', 'type', 'href', 'to', 'id', 'name', 'autoComplete', 'inputMode', 'rel',
  'target', 'role', 'key', 'htmlFor', 'aria-controls', 'aria-labelledby', 'aria-describedby',
  'accept', 'variant', 'size', 'tone', 'fill', 'viewBox', 'd', 'stroke', 'strokeLinecap',
  'strokeLinejoin', 'strokeWidth', 'stopColor', 'offset', 'loading', 'decoding', 'property',
  'content', 'lang', 'dir', 'src', 'crossOrigin', 'aria-roledescription', 'aria-live',
  'aria-current', 'value', 'icon', 'state', 'confirmVariant', 'mode', 'autoCapitalize',
  'enterKeyHint',
])
// Calls whose string arguments are not UI text.
const NON_TEXT_CALLEES = new Set([
  'console.log', 'console.warn', 'console.error', 'console.info', 'querySelector',
  'querySelectorAll', 'getItem', 'setItem', 'removeItem', 'addEventListener',
  'removeEventListener', 'matchMedia', 'collection', 'doc', 'where', 'orderBy', 'FieldPath',
  'replace', 'split', 'join', 'startsWith', 'endsWith', 'includes', 'test', 'match',
  'RegExp', 'getElementById', 'toLocaleDateString', 'toLocaleString', 'NumberFormat',
  'localized', 'collectionGroup', 'documentId', 'increment', 'createContext', 'lazy',
])

// A string that looks like words for people to read.
const ENGLISH = /[A-Za-z]{2,}/
const SENTENCE = /^(?=.*[A-Za-z]{2,})(?=.*\s)[\s\S]*$/

// Not UI text: Tailwind class lists, URLs, developer-only errors.
const CLASS_LIST = /^[a-z0-9:/[\]._%#&>=!-]+( [a-z0-9:/[\]._%#&>=!()-]+)*$/
const NOT_UI = [/^https?:\/\//, /must be used inside </]
// Lowercase words alone ("out of stock") are NOT treated as classes: a class
// list must contain a Tailwind-style token (has - : / [ ]) or only utility words.
const UTILITY_WORDS = new Set([
  'flex', 'grid', 'block', 'inline', 'hidden', 'relative', 'absolute', 'fixed', 'sticky',
  'static', 'truncate', 'underline', 'uppercase', 'italic', 'contents', 'group', 'peer',
  'sr-only', 'shrink-0', 'grow', 'border', 'rounded', 'shadow', 'transition', 'container',
])
const looksLikeClassList = (s) =>
  CLASS_LIST.test(s) &&
  (s.split(' ').some((token) => /[-:/[\]]/.test(token)) ||
    s.split(' ').every((token) => UTILITY_WORDS.has(token)))
const isNotUi = (s) => looksLikeClassList(s.trim()) || NOT_UI.some((re) => re.test(s))

// Exact strings allowed to stay as they are (brand names, technical values).
const ALLOWED = new Set([
  'Farm To Home', 'FarmToHome', 'Farm', 'To', 'Home', 'UPI', 'COD', 'Wikimedia Commons',
  'Content-Type', 'utf-8', 'en-IN', 'hi-IN', 'mr-IN', 'noindex, nofollow',
])

function walkFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walkFiles(path, out)
    else if (/\.(jsx?|mjs)$/.test(name)) out.push(path)
  }
  return out
}

function calleeName(node) {
  const c = node.callee
  if (!c) return ''
  if (c.type === 'Identifier') return c.name
  if (c.type === 'MemberExpression' && c.property?.type === 'Identifier') {
    const obj = c.object?.type === 'Identifier' ? `${c.object.name}.` : ''
    return obj === 'console.' ? `console.${c.property.name}` : c.property.name
  }
  return ''
}

function stringValue(node) {
  if (!node) return null
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked).join('')
  }
  return null
}

function lineOf(code, offset) {
  return code.slice(0, offset).split('\n').length
}

const keys = new Map() // key → first location
const problems = []

for (const file of walkFiles(SRC)) {
  const rel = relative(ROOT, file)
  if (SKIP_FILES.has(rel)) continue
  const code = readFileSync(file, 'utf8')
  let ast
  try {
    ast = parseAst(code, { lang: file.endsWith('.jsx') ? 'jsx' : 'js' })
  } catch (error) {
    problems.push(`${rel}: could not parse (${error.message.split('\n')[0]})`)
    continue
  }
  const at = (node) => `${rel}:${lineOf(code, node.start)}`
  const flag = (node, text, why) => {
    const clean = text.replace(/\s+/g, ' ').trim()
    if (!clean || ALLOWED.has(clean)) return
    if (why !== 'untranslated text in JSX expression' && isNotUi(clean)) return
    if (why === 'untranslated text in JSX expression' && /^https?:\/\//.test(clean)) return
    problems.push(`${at(node)}  ${why}: "${clean.slice(0, 80)}"`)
  }
  const addKey = (node, arg) => {
    const value = stringValue(arg)
    if (value != null && !keys.has(value)) keys.set(value, at(node))
  }

  // ctx: { safe } — inside t()/msg()/non-text call or non-text attribute
  function visit(node, ctx) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach((n) => visit(n, ctx))

    switch (node.type) {
      case 'ImportDeclaration':
      case 'ExportAllDeclaration':
        return
      case 'ExportNamedDeclaration':
        if (node.source) return
        break
      case 'CallExpression':
      case 'NewExpression': {
        const name = calleeName(node)
        if (name === 't' || name === 'msg' || name === 'tx') {
          addKey(node, node.arguments[0])
          visit(node.arguments.slice(1), ctx)
          return
        }
        if (name === 'tp') {
          addKey(node, node.arguments[1])
          addKey(node, node.arguments[2])
          visit(node.arguments.slice(3), ctx)
          visit(node.arguments[0], ctx)
          return
        }
        if (NON_TEXT_CALLEES.has(name) || name.startsWith('console.')) {
          visit(node.callee, ctx)
          return visit(node.arguments, { safe: true })
        }
        break
      }
      case 'JSXAttribute': {
        const name = node.name?.name?.name ?? node.name?.name
        if (NON_TEXT_ATTRS.has(name) || (typeof name === 'string' && name.startsWith('data-'))) {
          return visit(node.value, { safe: true })
        }
        if (!TEXT_ATTRS.has(name) && node.value?.type === 'JSXExpressionContainer') {
          // e.g. onClick={...}, checked={...}: code, not text (JSX inside still checked)
          return visit(node.value.expression, { ...ctx, jsx: false })
        }
        const value = stringValue(node.value)
        if (value != null) {
          if (TEXT_ATTRS.has(name) && ENGLISH.test(value)) flag(node, value, `untranslated ${name}`)
          return
        }
        return visit(node.value, ctx)
      }
      case 'JSXText':
        if (ENGLISH.test(node.value)) flag(node, node.value, 'untranslated JSX text')
        return
      case 'Literal':
      case 'TemplateLiteral': {
        if (ctx.safe) return node.type === 'TemplateLiteral' ? visit(node.expressions, ctx) : undefined
        const value = node.type === 'Literal' ? node.value : node.quasis.map((q) => q.value.cooked).join('')
        // Rendered directly in JSX: even single words like 'FREE' must be translated.
        if (ctx.jsx && typeof value === 'string' && ENGLISH.test(value) && !ALLOWED.has(value.trim())) {
          flag(node, value, 'untranslated text in JSX expression')
          if (node.type === 'TemplateLiteral') visit(node.expressions, ctx)
          return
        }
        if (typeof value === 'string' && SENTENCE.test(value) && /[A-Z.!?…]/.test(value)) {
          flag(node, value, 'untranslated string')
        }
        if (node.type === 'TemplateLiteral') visit(node.expressions, ctx)
        return
      }
      case 'Property': {
        // { label: 'Fruits' } style UI text in data objects
        const keyName = node.key?.name ?? node.key?.value
        const value = stringValue(node.value)
        if (!ctx.safe && value != null && TEXT_ATTRS.has(keyName) && ENGLISH.test(value)) {
          flag(node, value, `untranslated "${keyName}"`)
          return
        }
        if (node.computed) visit(node.key, { ...ctx, jsx: false })
        return visit(node.value, ctx)
      }
      case 'AssignmentPattern': {
        // Default props: ({ label = 'Loading…' }) — shown to people when not passed.
        const keyName = node.left?.name
        const value = stringValue(node.right)
        if (!ctx.safe && value != null && TEXT_ATTRS.has(keyName) && ENGLISH.test(value)) {
          flag(node, value, `untranslated default "${keyName}"`)
          return
        }
        break
      }
      case 'BinaryExpression':
        if (['===', '!==', '==', '!=', 'in', 'instanceof'].includes(node.operator)) {
          return visit([node.left, node.right], { ...ctx, safe: true })
        }
        break
      case 'SwitchCase':
        visit(node.test, { ...ctx, safe: true })
        return visit(node.consequent, ctx)
      case 'JSXExpressionContainer':
        // Anything rendered as a child (or in a text attribute) is UI text.
        return visit(node.expression, { ...ctx, jsx: true })
      case 'MemberExpression':
        visit(node.object, ctx)
        if (node.computed) visit(node.property, ctx)
        return
    }
    for (const [prop, child] of Object.entries(node)) {
      if (prop === 'type' || prop === 'start' || prop === 'end' || prop === 'range' || prop === 'loc') continue
      if (child && typeof child === 'object') visit(child, ctx)
    }
  }
  visit(ast, { safe: false })
}

// ---------- dictionaries ----------
// {placeholders} and <tags> must match between English and the translation.
const placeholders = (s) =>
  [...s.matchAll(/\{(\w+)\}|<(\w+)>/g)].map((m) => m[1] ?? `<${m[2]}>`).sort().join(',')
const dictionaries = {
  hi: (await import(join(SRC, 'i18n/hi.js'))).default,
  mr: (await import(join(SRC, 'i18n/mr.js'))).default,
}
// `--keys <file>` writes every key (with its first location) as JSON, for translators.
const keysArg = process.argv.indexOf('--keys')
if (keysArg > 0) {
  const { writeFileSync } = await import('node:fs')
  writeFileSync(process.argv[keysArg + 1], JSON.stringify(Object.fromEntries(keys), null, 2))
}

for (const [lang, dict] of Object.entries(dictionaries)) {
  for (const [key, where] of keys) {
    if (!(key in dict)) problems.push(`${where}  missing ${lang} translation: "${key}"`)
    else if (placeholders(key) !== placeholders(dict[key])) {
      problems.push(`src/i18n/${lang}.js  placeholders differ for "${key}"`)
    }
  }
  const unused = Object.keys(dict).filter((k) => !keys.has(k))
  if (unused.length) {
    console.warn(`(${lang}.js has ${unused.length} unused translations, e.g. "${unused[0]}")`)
  }
}

if (problems.length) {
  console.error(problems.join('\n'))
  console.error(`\n✖ ${problems.length} translation problem(s). ${keys.size} keys found.`)
  process.exit(1)
}
console.log(`✓ All visible text is translatable; ${keys.size} keys translated into Hindi and Marathi.`)
