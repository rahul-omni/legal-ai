import { $generateNodesFromDOM } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, LexicalEditor } from "lexical";
import { useEffect } from "react";

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
      root.append(...nodes);
    });
  }, [editor, localContent]);

  useEffect(() => {
    console.log("editor", editor);
  }, [editor]);

  return null;
}
