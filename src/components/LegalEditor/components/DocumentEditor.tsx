import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $getSelection, EditorState } from "lexical";
import { FC } from "react";
import { useDocumentEditor } from "../reducersContexts/documentEditorReducerContext";
import { DiffHighlightPlugin } from "./lexical/DiffHighlightPlugin";
import { EditorInitializer } from "./lexical/EditorInitializer";
import { ToolbarPlugin } from "./lexical/ToolbarPlugin";
import { initialConfig } from "./lexical/initialConfig";
import "./lexical/lexical.css";

interface DocumentEditorProps {
  localContent: string;
  handleSelectionChange: (_selectedText?: string) => void;
  // Diff highlighting props
  showDiffHighlight?: boolean;
  onToggleDiffHighlight?: () => void;
  diffOldText?: string | null;
  diffNewText?: string | null;
}

export const DocumentEditor: FC<DocumentEditorProps> = ({
  localContent,
  handleSelectionChange,
}) => {
  const { lexicalEditorRef } = useDocumentEditor();

  const handleSelectionUpdate = () => {
    const selection = $getSelection();
    const selectedText = selection?.getTextContent() || undefined;
    handleSelectionChange(selectedText);
  };

  const handleEditorChange = (editorState: EditorState) => {
    editorState.read(() => {
      handleSelectionUpdate();
    });
  };

  return (
    <div className="flex items-start">
      <div className="flex-1">
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
            <DiffHighlightPlugin />
            <OnChangePlugin onChange={handleEditorChange} />
            <HistoryPlugin />
          </div>
        </LexicalComposer>
      </div>
    </div>
  );
};
