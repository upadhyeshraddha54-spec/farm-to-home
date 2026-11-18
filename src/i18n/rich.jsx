import { Fragment } from 'react'
import { t } from './core'

/**
 * Translates a sentence that contains links or formatting, keeping word order
 * natural in every language:
 *
 *   tx('Please <signin>sign in</signin> to review {product}.', {
 *     signin: (text) => <Link to="/login">{text}</Link>,   // tag → render function
 *     product: <strong>Tomatoes</strong>,                 // {placeholder} → any node
 *   })
 *
 * The translation keeps the same <tags> and {placeholders}; the checker
 * verifies that.
 */
export function tx(key, parts = {}) {
  const template = t(key) // raw translation, placeholders untouched
  const nodes = []
  const pattern = /<(\w+)>([\s\S]*?)<\/\1>|\{(\w+)\}/g
  let last = 0
  let match
  let i = 0
  while ((match = pattern.exec(template))) {
    if (match.index > last) nodes.push(template.slice(last, match.index))
    const [whole, tag, inner, name] = match
    if (tag) {
      const render = parts[tag]
      nodes.push(<Fragment key={i++}>{typeof render === 'function' ? render(inner) : inner}</Fragment>)
    } else {
      nodes.push(<Fragment key={i++}>{name in parts ? parts[name] : whole}</Fragment>)
    }
    last = match.index + whole.length
  }
  if (last < template.length) nodes.push(template.slice(last))
  return nodes
}
