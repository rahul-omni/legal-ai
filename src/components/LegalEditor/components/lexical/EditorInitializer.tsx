import { $generateNodesFromDOM } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getRoot,
  $isDecoratorNode,
  $isElementNode,
  LexicalEditor,
  type LexicalNode,
} from "lexical";
import { useEffect } from "react";

/** Root may only contain element or decorator nodes; HTML/plain translation streams can yield top-level text nodes. */
function normalizeNodesForRoot(nodes: LexicalNode[]): LexicalNode[] {
  if (nodes.length === 0) {
    return [$createParagraphNode()];
  }
  const out: LexicalNode[] = [];
  for (const node of nodes) {
    if ($isElementNode(node) || $isDecoratorNode(node)) {
      out.push(node);
    } else {
      const p = $createParagraphNode();
      p.append(node);
      out.push(p);
    }
  }
  return out;
}

export function EditorInitializer({
  localContent,
  setEditorRef,
}: {
  localContent: string;
  setEditorRef: (_editor: LexicalEditor) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    setEditorRef(editor);

    if (!localContent) return;
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(localContent, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.append(...normalizeNodesForRoot(nodes));
    });
  }, [editor, localContent]);

  return null;
}
