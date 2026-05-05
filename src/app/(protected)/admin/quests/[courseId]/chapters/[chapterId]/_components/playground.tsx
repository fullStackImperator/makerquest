'use client'
import Editor from './editorMe'
import playgroundTemplate from './editor/templates/Playground.json'
// import type { EditorDocument } from '@/types'
import type { SerializedEditorState } from 'lexical'
import dynamic from 'next/dynamic'

// const DisplayAd = dynamic(() => import('@/components/Ads/DisplayAd'), {
//   ssr: false,
// })

interface EditorDocument {
  id: string
  name: string
  head: string
  data: SerializedEditorState
  createdAt: string | Date
  updatedAt: string | Date
  handle?: string | null
  baseId?: string | null
}

const document = playgroundTemplate as unknown as EditorDocument
const Playground: React.FC = () => (
  <>
    {/*    EXAMPLE HOW TO INTEGRATE TEMPLATE INTO MATH EDITOR!   */}
    <div> EXAMPLE HOW TO INTEGRATE TEMPLATE INTO MATH EDITOR!</div>
    {/* <Editor document={document} /> */}
    {/* <DisplayAd sx={{ mt: 2 }} /> */}
  </>
)

export default Playground
