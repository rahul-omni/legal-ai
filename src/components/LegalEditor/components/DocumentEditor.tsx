import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $getSelection, EditorState } from "lexical";
import { debounce } from "lodash";
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
  showDiffHighlight = false,
  onToggleDiffHighlight,
  diffOldText = null,
  diffNewText = null,
}) => {
  const { lexicalEditorRef } = useDocumentEditor();

  const onCompare = false;

  const hasDiffData = Boolean(diffOldText && diffNewText);

  const handleSelectionUpdate = () => {
    const selection = $getSelection();
    const selectedText = selection?.getTextContent() || undefined;
    handleSelectionChange(selectedText);
  };

  const handleEditorChange = debounce((editorState: EditorState) => {
    editorState.read(() => {
      handleSelectionUpdate();
    });
  }, 300);
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
          <ToolbarPlugin
            showDiffHighlight={showDiffHighlight}
            onToggleDiffHighlight={onToggleDiffHighlight}
            hasDiffData={hasDiffData}
          />
          <div className="editor-inner">
            <RichTextPlugin
              placeholder={
                <div className="editor-placeholder">enter text here...</div>
              }
              contentEditable={<ContentEditable className="editor-input" />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <DiffHighlightPlugin
              isEnabled={showDiffHighlight}
              oldText={diffOldText}
              newText={diffNewText}
              onToggle={onToggleDiffHighlight || (() => {})}
            />
            <OnChangePlugin onChange={handleEditorChange} />
            <HistoryPlugin />
          </div>
        </LexicalComposer>
      </div>
      {onCompare && (
        <div className="flex-1">
          <LexicalComposer initialConfig={initialConfig}>
            <EditorInitializer
              localContent={localContent}
              setEditorRef={(editor) => {
                lexicalEditorRef.current = editor;
              }}
            />
            <ToolbarPlugin
              showDiffHighlight={showDiffHighlight}
              onToggleDiffHighlight={onToggleDiffHighlight}
              hasDiffData={hasDiffData}
            />
            <div className="editor-inner">
              <RichTextPlugin
                placeholder={
                  <div className="editor-placeholder">enter text here...</div>
                }
                contentEditable={<ContentEditable className="editor-input" />}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <DiffHighlightPlugin
                isEnabled={showDiffHighlight}
                oldText={diffOldText}
                newText={diffNewText}
                onToggle={onToggleDiffHighlight || (() => {})}
              />
              <OnChangePlugin onChange={handleEditorChange} />
              <HistoryPlugin />
            </div>
          </LexicalComposer>
        </div>
      )}
    </div>
  );
};
