// plugins/DiffPlugin.tsx
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { useState } from "react";
import { DocumentDiffViewer } from "../DocumentDiffViewer";

export function exportToPlainText(): string {
  let text = "";

  const root = $getRoot();
  const paragraphs = root.getChildren();

  for (const paragraph of paragraphs) {
    text += paragraph.getTextContent() + "\n";
  }

  return text.trim();
}

export function DiffPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showDiff, setShowDiff] = useState(false);
  const [oldText, setOldText] = useState("");

  const handleShowDiff = () => {
    editor.getEditorState().read(() => {
      const currentText = exportToPlainText();
      setOldText(currentText);
      setShowDiff(true);
    });
  };

  const getCurrentText = () => {
    return editor.getEditorState().read(() => exportToPlainText());
  };

  return (
    <>
      <button onClick={handleShowDiff} className="diff-button">
        Compare Versions
      </button>

      {showDiff && (
        <DocumentDiffViewer
          oldText={oldText}
          newText={getCurrentText()}
          onClose={() => setShowDiff(false)}
        />
      )}
    </>
  );
}
