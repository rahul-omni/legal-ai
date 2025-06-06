// plugins/TrackChangesPlugin.tsx
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TextNode } from "lexical";
import { useEffect } from "react";

export const TrackChangesPlugin = ({
  userId,
  isTrackingEnabled = true,
}: {
  userId: string;
  isTrackingEnabled?: boolean;
}) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor || !isTrackingEnabled) return;

    const removeTextTransform = editor.registerNodeTransform(TextNode, (node) => {
      // Handle text changes and convert to our custom nodes
    });

    return () => {
      removeTextTransform();
    };
  }, [editor, isTrackingEnabled, userId]);

  return null;
};