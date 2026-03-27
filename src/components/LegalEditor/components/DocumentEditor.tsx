import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $getSelection, EditorState, LexicalEditor } from "lexical";
import { debounce } from "lodash";
import { FC, useCallback, useEffect, useMemo } from "react";
import { useDocumentEditor } from "../reducersContexts/documentEditorReducerContext";
import { EditorInitializer } from "./lexical/EditorInitializer";
import { ToolbarPlugin } from "./lexical/ToolbarPlugin";
import { initialConfig } from "./lexical/initialConfig";
import { $generateHtmlFromNodes } from "@lexical/html";

import "./lexical/lexical.css";

interface DocumentEditorProps {
  localContent: string;
  handleSelectionChange: (_selectedText?: string) => void;
  activeTabId: string;
}

export const DocumentEditor: FC<DocumentEditorProps> = ({
  localContent,
  handleSelectionChange,
  activeTabId,
}) => {
  const { lexicalEditorRef, docEditorDispatch } = useDocumentEditor();

  // Debounced persist must receive `editor` from OnChangePlugin — after a delay,
  // lexicalEditorRef may be null/stale (tab switch, unmount), which breaks $generateHtmlFromNodes.
  const debouncedPersist = useMemo(
    () =>
      debounce(
        (editorState: EditorState, editor: LexicalEditor | null, tabId: string | null) => {
          if (!editor) return;
          editorState.read(() => {
            const selection = $getSelection();
            handleSelectionChange(selection?.getTextContent() || undefined);
            if (!tabId) return;
            try {
              const htmlContent = $generateHtmlFromNodes(editor);
              docEditorDispatch({
                type: "UPDATE_TAB_CONTENT",
                payload: { tabId, content: htmlContent },
              });
            } catch {
              // Editor may be tearing down; ignore.
            }
          });
        },
        300
      ),
    [docEditorDispatch, handleSelectionChange]
  );

  useEffect(() => () => debouncedPersist.cancel(), [debouncedPersist]);

  const handleEditorChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      debouncedPersist(editorState, editor, activeTabId);
    },
    [debouncedPersist, activeTabId]
  );

  return (
    <div className="editor-container">
      <LexicalComposer initialConfig={initialConfig}>
        <EditorInitializer
          localContent={localContent}
          setEditorRef={(editor) => {
            lexicalEditorRef.current = editor;
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
          <OnChangePlugin onChange={handleEditorChange} />
          <HistoryPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
};
