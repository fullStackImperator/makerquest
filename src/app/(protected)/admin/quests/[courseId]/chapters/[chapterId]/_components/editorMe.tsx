'use client'

import { MutableRefObject, useRef, useState } from 'react'
import { memo } from 'react'
// import { EditorDocument } from '@/types'
// import type { EditorState, LexicalEditor } from '../_components/editor/types'
import type { SerializedEditorState, EditorState, LexicalEditor } from 'lexical'

import dynamic from 'next/dynamic'
import SplashScreen from './splashScreen'
// import type { SerializedEditorState } from 'lexical'

// export interface EditorDocument {
//   id: string
//   name: string
//   head: string
//   data: SerializedEditorState
//   createdAt: string | Date
//   updatedAt: string | Date
//   handle?: string | null
//   baseId?: string | null
// }
export interface EditorData {
  editorData: SerializedEditorState
}
export interface EditorEditable {
  editorEditable: boolean
}

const Editor = dynamic(() => import('./editor/Editor'), {
  ssr: false,
  loading: () => <SplashScreen title="Loading Editor" />,
})

const Container: React.FC<{
  editorData: SerializedEditorState | null
  editorEditable: boolean
  // document: EditorDocument
  editorRef?: MutableRefObject<LexicalEditor | null>
  onChange?: (
    editorState: EditorState,
    editor: LexicalEditor,
    tags: Set<string>
  ) => void
}> = ({ editorData, editorEditable, editorRef, onChange }) => {
  const fallbackRef = useRef<LexicalEditor | null>(null)
  const resolvedEditorRef = editorRef ?? fallbackRef
  // }> = ({ document, editorRef, onChange }) => {
  const [editorState, setEditorState] = useState<EditorState>()

  // Handle onChange event from the plugin
  function onEditorChange(editorState: EditorState) {
    // setEditorState(editorState)

    // Call toJSON on the EditorState object, which produces a serialization safe string
    // const editorStateJSON = editorState.toJSON()
    // However, we still have a JavaScript object, so we need to convert it to an actual string with JSON.stringify
    setEditorState(editorState)
    // setEditorState(editorStateJSON)
    // setEditorState(JSON.stringify(editorStateJSON))
  }

  console.log('editorState: ', editorState)

  // Handle onChange event from the plugin
  const handleEditorChange = (
    newEditorState: EditorState,
    editor: LexicalEditor,
    tags: Set<string>
  ) => {
    setEditorState(newEditorState)

    // Call the provided onChange callback if it exists
    if (onChange) {
      onChange(newEditorState, editor, tags)
    }
  }

  // Handle save to database
  // const handleSaveToDatabase = async () => {
  //   try {
  //     const response = await axios.post('/api/matheditor', {
  //       ...document,
  //       name: 'mathe editor stiv',
  //       data: editorState, // Pass serialized state to the backend
  //     })
  //     if (response.status === 200) {
  //       console.log('Document saved to database successfully')
  //     } else {
  //       console.error('Failed to save document:', response.statusText)
  //     }
  //   } catch (error) {
  //     console.error('Error saving document:', error)
  //   }
  // }

  return (
    <>
      <Editor
        // initialConfig={{ editorState: JSON.stringify(editorState) }}
        initialConfig={{
          editorState: editorData
            ? JSON.stringify(editorData)
            : undefined,
          editable: editorEditable,
        }}
        // initialConfig={{
        //   editorState: JSON.stringify(document.data),
        //   // editable: false,
        // }}
        // onChange={onEditorChange}
        onChange={handleEditorChange}
        editorRef={resolvedEditorRef}
      />
      {/* <Button onClick={handleSaveToDatabase} className="mt-20">
        Save to Database
      </Button> */}
    </>
  )
}

// export default memo(
//   Container,
//   (prev, next) => prev.document.id === next.document.id
// )

export default memo(
  Container,
  (prev, next) => prev.editorData === next.editorData
)