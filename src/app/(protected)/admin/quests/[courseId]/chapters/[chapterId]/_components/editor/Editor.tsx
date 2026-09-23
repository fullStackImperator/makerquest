"use client"
import type { EditorState, LexicalEditor } from "lexical";
import { LexicalComposer, InitialConfigType } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { editorConfig, studentEditorConfig } from "./config";
import { EditorVariantProvider, type EditorVariant } from "./context/EditorVariantContext";
import { EditorPlugins } from "./plugins";
import { MutableRefObject, RefCallback } from "react";
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import "mathlive";
import "mathlive/fonts.css";
import "./styles.css";

export const Editor: React.FC<{
  initialConfig: Partial<InitialConfigType>;
  editorRef: MutableRefObject<LexicalEditor | null> | RefCallback<LexicalEditor>
  onChange?: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;
  variant?: EditorVariant;
  uploadImage?: (file: File) => Promise<string>;
}> = ({ initialConfig, onChange, editorRef, variant = "teacher", uploadImage }) => {
    const { editable } = initialConfig
    const baseConfig = variant === "student" ? studentEditorConfig : editorConfig

  return (
    <EditorVariantProvider value={{ variant, uploadImage }}>
      <LexicalComposer initialConfig={{ ...baseConfig, ...initialConfig }}>
        <>
          {editable && <ToolbarPlugin />}
          <EditorPlugins contentEditable={<ContentEditable className="editor-input" />} onChange={onChange} />
          <EditorRefPlugin editorRef={editorRef} />
        </>
      </LexicalComposer>
    </EditorVariantProvider>
  );
};

export default Editor;