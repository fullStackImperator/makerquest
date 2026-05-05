import type { SerializedEditorState } from 'lexical'
import { createHeadlessEditor } from '@lexical/headless'
import { editorConfig } from '../config'
import { $generateHtmlFromNodes } from './html'
import { parseHTML } from 'linkedom'

const editor = createHeadlessEditor(editorConfig)

export const generateHtml = (data: SerializedEditorState) =>
  new Promise<string>((resolve, reject) => {
    if (typeof window === 'undefined') {
      const dom = parseHTML(
        '<!DOCTYPE html><html><head></head><body></body></html>',
      )
      global = dom
      global.document = dom.document
      global.DocumentFragment = dom.DocumentFragment
      global.Element = dom.Element
    }
    try {
      const editorState = editor.parseEditorState(data)
      editor.setEditorState(editorState)
      editorState.read(() => {
        let html = $generateHtmlFromNodes(editor)
        // Avoid `/gs` so TS is happy with target below ES2018; `.` never matches newline here.
        const stickyRegex =
          /<p\b[^>]*>(?:(?!<\/p>)[\s\S])*<div\b[^>]*class="sticky-note-wrapper"[^>]*>(?:(?!<\/div>)[\s\S])*<\/div>(?:(?!<\/p>)[\s\S])*<\/p>/g
        const figureRegex =
          /<p\b[^>]*>(?:(?!<\/p>)[\s\S])*<figure\b[^>]*>(?:(?!<\/figure>)[\s\S])*<\/figure>(?:(?!<\/p>)[\s\S])*<\/p>/g
        const stickies = html.match(stickyRegex) || []
        const figures = html.match(figureRegex) || []
        ;[...stickies, ...figures].forEach(
          (match) =>
            (html = html.replace(
              match,
              match.replace(/^<p/, '<div').replace(/<\/p>$/, '</div>'),
            )),
        )
        resolve(html)
      })
    } catch (error) {
      reject(error)
    }
  })
