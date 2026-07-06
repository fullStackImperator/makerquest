/** Extract {{blank:id}} markers from Lexical JSON (stringified or object). */
export function extractBlankIdsFromPrompt(prompt: unknown): string[] {
  const text = lexicalToPlainText(prompt)
  const matches = text.matchAll(/\{\{blank:([^}]+)\}\}/g)
  return [...matches].map((m) => m[1])
}

function lexicalToPlainText(data: unknown): string {
  if (!data) return ''
  let obj = data
  if (typeof data === 'string') {
    try {
      obj = JSON.parse(data)
    } catch {
      return data
    }
  }
  const parts: string[] = []
  const walk = (node: { type?: string; text?: string; children?: unknown[] }) => {
    if (node.text) parts.push(node.text)
    if (node.children) {
      for (const c of node.children) {
        walk(c as { type?: string; text?: string; children?: unknown[] })
      }
    }
  }
  const root = (obj as { root?: { children?: unknown[] } })?.root
  if (root?.children) {
    for (const c of root.children) {
      walk(c as { type?: string; text?: string; children?: unknown[] })
    }
  }
  return parts.join(' ')
}
