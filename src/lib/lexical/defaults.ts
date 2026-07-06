import type { SerializedEditorState } from 'lexical'

/** Default empty Lexical document — safe for server actions and client. */
export const EMPTY_LEXICAL_STATE = {
  root: {
    children: [
      {
        children: [],
        direction: 'ltr',
        format: 'left',
        indent: 0,
        type: 'paragraph',
        version: 1,
        textFormat: 0,
        textStyle: '',
      },
    ],
    direction: 'ltr',
    format: 'left',
    indent: 0,
    type: 'root',
    version: 1,
  },
} as unknown as SerializedEditorState

export function emptyLexicalState(): SerializedEditorState {
  return EMPTY_LEXICAL_STATE
}

export function parseLexicalJson(data: unknown): SerializedEditorState | null {
  if (!data) return null
  try {
    if (typeof data === 'string') {
      return JSON.parse(data) as SerializedEditorState
    }
    return data as SerializedEditorState
  } catch {
    return null
  }
}

export function resolveLexicalInitialData(
  data: unknown,
): SerializedEditorState {
  return parseLexicalJson(data) ?? EMPTY_LEXICAL_STATE
}
