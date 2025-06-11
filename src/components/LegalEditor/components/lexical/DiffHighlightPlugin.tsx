import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  TextNode,
} from "lexical";
import { useEffect } from "react";
import { diff_match_patch, DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from "diff-match-patch";

interface DiffHighlightPluginProps {
  isEnabled: boolean;
  oldText: string | null;
  newText: string | null;
  onToggle: () => void;
}

export function DiffHighlightPlugin({
  isEnabled,
  oldText,
  newText,
}: DiffHighlightPluginProps) {
  const [editor] = useLexicalComposerContext();

  // Apply diff highlighting when enabled
  useEffect(() => {
    if (!isEnabled || !oldText || !newText) return;

    editor.update(() => {
      applyDiffHighlighting(oldText, newText);
    });
  }, [editor, isEnabled, oldText, newText]);

  const applyDiffHighlighting = (oldText: string, newText: string) => {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(oldText, newText);
    dmp.diff_cleanupSemantic(diffs);

    const root = $getRoot();
    root.clear();

    // Create a paragraph to hold all the diff text
    const paragraph = $createParagraphNode();
    
    for (const [op, text] of diffs) {
      if (!text) continue;

      const textNode = $createTextNode(text);
        // Use existing Lexical formats creatively for diff highlighting
      switch (op) {
        case DIFF_INSERT:
          // Use underline + bold for additions
          textNode.setFormat(0b0101); // bold (1) + underline (4) = 5
          break;
        case DIFF_DELETE:
          // Use strikethrough + italic for deletions
          textNode.setFormat(0b1010); // italic (2) + strikethrough (8) = 10
          break;
        case DIFF_EQUAL:
          // No special formatting for unchanged text
          break;
      }
      
      paragraph.append(textNode);
    }
    
    root.append(paragraph);
  };

  return null;
}

// Utility function to extract plain text from Lexical editor
export function extractPlainTextFromEditor(editor: any): string {
  let text = "";
  editor.getEditorState().read(() => {
    const root = $getRoot();
    text = root.getTextContent();
  });
  return text;
}

// Utility function to check if node has diff formatting
export function hasDiffFormatting(node: TextNode): boolean {
  const format = node.getFormat();
  return format === 0b0101 || format === 0b1010; // Check for our specific diff format combinations
}

// Utility function to clear all diff formatting from editor
export function clearAllDiffFormatting(editor: any) {
  editor.update(() => {
    const root = $getRoot();
    const textNodes = root.getAllTextNodes();
    
    textNodes.forEach((node) => {
      if (hasDiffFormatting(node)) {
        node.setFormat(0); // Clear all formatting
      }
    });
  });
}
