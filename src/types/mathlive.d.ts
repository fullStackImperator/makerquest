declare module 'mathlive' {
  export interface MathfieldElement extends HTMLElement {
    getValue(selection?: unknown, format?: string): string
    setValue(value: string, options?: { selectionMode?: string }): void
    selection: { ranges: unknown[] }
    selectionIsCollapsed: boolean
    applyStyle(style: Record<string, unknown>, range: unknown): void
    executeCommand(command: string[]): void
    showMenu(options: {
      location: { x: number; y: number }
      modifiers: { alt: boolean; control: boolean; shift: boolean; meta: boolean }
    }): void
  }
}

import type React from 'react'
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          value?: string
          readOnly?: boolean
        },
        HTMLElement
      >
    }
  }
}
export {}
