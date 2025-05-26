import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  EditorState,
  LexicalEditor,
} from "lexical";
import { FC, RefObject, useRef } from "react";
import { ToolbarPlugin } from "./lexical/ToolbarPlugin";
import { initialConfig } from "./lexical/initialConfig";
import { EditorInitializer } from "./lexical/EditorInitializer";
import "./lexical/lexical.css";

interface DocumentEditorProps {
  localContent: string;
  handleSelectionChange: (_selectedText?: string) => void;
  editorRef: RefObject<LexicalEditor | null>;
  onSelectedTextChange?: (_text: string) => void;
}

export const DocumentEditor: FC<DocumentEditorProps> = ({
  localContent,
  editorRef,
  handleSelectionChange,
  onSelectedTextChange,
}) => {
  const caretPositionRef = useRef<{ index: number; length: number } | null>(
    null
  );

  const handleEditorSelectionChange = (editorState: EditorState) => {
    let text: string | undefined;
    editorState.read(() => {
      const selection = $getSelection();
      if (!selection) {
        text = undefined;
        if (onSelectedTextChange) onSelectedTextChange("");
        return;
      }

      if (selection.getTextContent().length === 0) {
        caretPositionRef.current = {
          index: selection.anchor.offset,
          length: 0,
        };
      } else {
        text = selection.getTextContent();
        if (onSelectedTextChange) onSelectedTextChange(text);
      }
    });

    handleSelectionChange(text);
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorInitializer
        localContent={localContent}
        setEditorRef={(editor) => {
          editorRef.current = editor;
        }}
      />
      <ToolbarPlugin />
      <div className="editor-inner">
        <RichTextPlugin
          placeholder={
            <div className="editor-placeholder">enter text here...</div>
          }
          contentEditable={<ContentEditable className="editor-input" />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={handleEditorSelectionChange} />
        <HistoryPlugin />
      </div>
    </LexicalComposer>
  );
};

// Add a public method to the Editor component through its ref
export function insertTextAtSelection(editor: LexicalEditor, text: string) {
  editor.update(() => {
    const selection = $getSelection();
    if (selection) {
      selection.insertText(text);
    } else {
      const root = $getRoot();
      const lastChild = root.getLastChild();
      if (lastChild) {
        lastChild.select(lastChild.getTextContentSize(), 0);
        $getSelection()?.insertText(text);
      } else {
        const textNode = $createTextNode(text);
        root.append(textNode);
      }
    }
  });
}
