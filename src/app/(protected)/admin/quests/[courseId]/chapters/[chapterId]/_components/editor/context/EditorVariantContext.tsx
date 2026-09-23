'use client'
import Compressor from 'compressorjs'
import { createContext, useContext } from 'react'

/**
 * `teacher`: full editor, images are embedded as base64 (existing behaviour).
 * `student`: reduced block set; when `uploadImage` is set, images are
 * compressed and uploaded, and only their URL is stored in the document.
 */
export type EditorVariant = 'teacher' | 'student'

export type EditorVariantContextValue = {
  variant: EditorVariant
  /** Uploads an image and resolves to its public URL. */
  uploadImage?: (file: File) => Promise<string>
}

const EditorVariantContext = createContext<EditorVariantContextValue>({
  variant: 'teacher',
})

export const EditorVariantProvider = EditorVariantContext.Provider

export function useEditorVariant() {
  return useContext(EditorVariantContext)
}

/** Resizes and re-encodes a photo before upload; falls back to the original file. */
export function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    new Compressor(file, {
      quality: 0.7,
      maxWidth: 2000,
      maxHeight: 2000,
      mimeType: 'image/jpeg',
      convertSize: 0,
      success(result) {
        const name = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
        resolve(new File([result], name, { type: 'image/jpeg' }))
      },
      error() {
        resolve(file)
      },
    })
  })
}
