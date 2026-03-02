import React from 'react'

function cn(...xs) {
  return xs.filter(Boolean).join(' ')
}

function renderTextNode(node, key) {
  let el = node.text ?? ''

  // ✅ payload lexical uses format bitmask sometimes, and/or "bold/italic/underline" booleans depending on version
  const format = node.format ?? 0
  const isBold = node.bold || (format & 1) === 1
  const isItalic = node.italic || (format & 2) === 2
  const isUnderline = node.underline || (format & 4) === 4
  const isStrikethrough = node.strikethrough || (format & 8) === 8
  const isCode = node.code || (format & 16) === 16

  if (isCode) el = <code className="px-1 py-[1px] rounded bg-black/25">{el}</code>
  if (isBold) el = <strong>{el}</strong>
  if (isItalic) el = <em>{el}</em>
  if (isUnderline) el = <u>{el}</u>
  if (isStrikethrough) el = <s>{el}</s>

  return <React.Fragment key={key}>{el}</React.Fragment>
}

function renderChildren(children, ctx) {
  if (!Array.isArray(children)) return null
  return children.map((child, idx) => renderNode(child, `${ctx.keyPrefix}-${idx}`, ctx))
}

function getTextContent(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  if (Array.isArray(node.children)) return node.children.map(getTextContent).join('')
  return ''
}

function renderList(children, ordered, key, ctx) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag key={key} className={cn('my-2 ps-5', ordered ? 'list-decimal' : 'list-disc')}>
      {children?.map((li, i) => renderNode(li, `${key}-li-${i}`, ctx))}
    </Tag>
  )
}

function renderNode(node, key, ctx) {
  if (!node) return null

  switch (node.type) {
    case 'root': {
      return (
        <React.Fragment key={key}>
          {renderChildren(node.children, { ...ctx, keyPrefix: key })}
        </React.Fragment>
      )
    }

    case 'text': {
      return renderTextNode(node, key)
    }

    case 'linebreak': {
      return <br key={key} />
    }

    case 'paragraph': {
      const txt = getTextContent(node).trim()
      // لو فاضي، خليه مسافة بسيطة عشان يحافظ على المسافات بين البراجراف
      return (
        <p key={key} className="my-2 whitespace-pre-wrap">
          {txt ? renderChildren(node.children, { ...ctx, keyPrefix: key }) : <span>&nbsp;</span>}
        </p>
      )
    }

    case 'heading': {
      // Payload lexical heading غالبًا: node.tag = 'h2'... أو node.level
      const Tag = node.tag || (node.level ? `h${node.level}` : 'h3')
      return (
        <Tag key={key} className="mt-4 mb-2 font-bold tracking-[0.14em]">
          {renderChildren(node.children, { ...ctx, keyPrefix: key })}
        </Tag>
      )
    }

    case 'quote': {
      return (
        <blockquote key={key} className="my-3 ps-3 border-s-2 border-white/20 text-white/85 italic">
          {renderChildren(node.children, { ...ctx, keyPrefix: key })}
        </blockquote>
      )
    }

    case 'link': {
      const href = node?.fields?.url || node?.fields?.href || '#'

      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
          onClick={(e) => {
            if (!href || href === '#') e.preventDefault()
          }}
        >
          {renderChildren(node.children, { ...ctx, keyPrefix: key })}
        </a>
      )
    }

    case 'list': {
      const ordered = node.listType === 'number' || node.ordered === true
      return renderList(node.children || [], ordered, key, ctx)
    }

    case 'listitem': {
      return (
        <li key={key} className="my-1">
          {renderChildren(node.children, { ...ctx, keyPrefix: key })}
        </li>
      )
    }

    // بعض النسخ بتطلع عناصر زي "span" أو "tab" أو "mark"
    default: {
      // fallback: render children لو موجودة
      if (Array.isArray(node.children)) {
        return (
          <React.Fragment key={key}>
            {renderChildren(node.children, { ...ctx, keyPrefix: key })}
          </React.Fragment>
        )
      }
      // لو node فيها text بشكل غير متوقع
      if (typeof node.text === 'string')
        return <React.Fragment key={key}>{node.text}</React.Fragment>
      return null
    }
  }
}

export function LexicalRich({ data, className = '' }) {
  if (!data || typeof data !== 'object') return null

  // لو جالك plain string بالغلط
  if (typeof data === 'string') {
    return <div className={cn('whitespace-pre-wrap', className)}>{data}</div>
  }

  const root = data.root || data
  return (
    <div className={cn('whitespace-pre-wrap', className)}>
      {renderNode(root, 'lexical-root', { keyPrefix: 'lexical' })}
    </div>
  )
}
