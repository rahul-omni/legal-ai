import { $generateNodesFromDOM } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Diff, diff } from "deep-diff";
import type { SerializedLexicalNode } from "lexical";
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $insertNodes,
  $isElementNode,
  $isTextNode,
  LexicalEditor,
  LexicalNode,
} from "lexical";
import { useEffect } from "react";
import { useDocumentEditor } from "../../reducersContexts/documentEditorReducerContext";

interface NodeDifference {
  type: "added" | "removed" | "modified";
  oldNode?: LexicalNode;
  newNode?: LexicalNode;
  path: string;
}

type SerializedNodeWithChildren = SerializedLexicalNode & {
  children?: SerializedLexicalNode[];
};

type DiffDelta = Record<string, any> | undefined;

export function DiffHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  const {
    docEditorState: { showDiffHighlight, activeTabId, openTabs, tabHistory },
  } = useDocumentEditor();

  useEffect(() => {
    const oldHtmlContent =
      openTabs.find((tab) => tab.id === activeTabId)?.content || "";

    const newHtmlContent =
      tabHistory.find((tab) => tab.id === activeTabId)?.content || "";

    if (!showDiffHighlight) {
      const changeToShow = newHtmlContent || oldHtmlContent;
      convertNodesFromHtml(editor, changeToShow);
      return;
    }

    if (showDiffHighlight) {
      const oldNodesJson = getNodesAsJson(editor, oldHtmlContent);
      const newNodesJson = getNodesAsJson(editor, newHtmlContent);

      const delta: Diff<any[], any[]>[] | undefined = diff(
        oldNodesJson,
        newNodesJson
      );

      console.log(
        "%c[DiffHighlightPlugin] Calculated diff:",
        "color: #007acc; font-weight: bold;",
        delta
      );

      if (!delta) return;

      processDeltaChanges(editor, newNodesJson, delta);
    }
  }, [showDiffHighlight]);

  return null;
}

function processDeltaChanges(
  editor: LexicalEditor,
  newNodes: SerializedLexicalNode[],
  delta: Diff<any[], any[]>[]
) {
  editor.update(() => {
    const root = $getRoot();
    root.clear();

    // Group changes by node path
    const nodeChanges = new Map<number, Diff<any[], any[]>[]>();

    delta.forEach((change) => {
      const nodeIndex = change?.path?.[0] as number;
      if (!nodeChanges.has(nodeIndex)) {
        nodeChanges.set(nodeIndex, []);
      }
      nodeChanges.get(nodeIndex)?.push(change);
    });

    // Process each node
    newNodes.forEach((node, nodeIndex) => {
      const paragraph = $createParagraphNode();
      const changes = nodeChanges.get(nodeIndex) || [];

      if (node.type === "paragraph" && node.children) {
        node.children.forEach((child, childIndex) => {
          // Find changes for this specific child
          const childChanges = changes.filter(
            (c) => c.path[1] === "children" && c.path[2] === childIndex
          );

          if (childChanges.length > 0) {
            // Handle changed content
            childChanges.forEach((change) => {
              if (change.item?.kind === "N") {
                // New node
                const textNode = $createTextNode(change.item.rhs.text);
                textNode.setStyle("background-color: #d4f8e8;");
                paragraph.append(textNode);
              } else if (change.kind === "E") {
                // Modified property
                const textNode = $createTextNode(change.rhs);
                textNode.setStyle("background-color: #fff3cd;");
                paragraph.append(textNode);
              }
            });
          } else {
            // Unchanged content
            if (child.type === "text") {
              paragraph.append($createTextNode(child.text));
            } else if (child.type === "linebreak") {
              paragraph.append($createLineBreakNode());
            }
          }
        });
      }

      root.append(paragraph);
    });

    // Handle deleted nodes
    delta
      .filter((d) => d.kind === "D" && d.path.length === 3)
      .forEach((deletion) => {
        const [nodeIndex, , childIndex] = deletion.path;
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode(deletion.lhs);
        textNode.setStyle(
          "background-color: #ffeaea; text-decoration: line-through;"
        );
        paragraph.append(textNode);
        root.append(paragraph);
      });
  });
}

const convertNodesFromHtml = (editor: LexicalEditor, htmlContent: string) => {
  const cleanHtml = htmlContent.trim();
  const wrappedHtml = `<html><body>${htmlContent}</body></html>`;
  const dom = new DOMParser().parseFromString(wrappedHtml, "text/html");

  console.log("convertNodesFromHtml called with HTML:", cleanHtml);
  editor.update(() => {
    $getRoot().clear();
    const nodes = $generateNodesFromDOM(editor, dom);
    console.log("Generated nodes from DOM in convertNodesFromHtml:", nodes);
    const validNodes = nodes.filter($isElementNode);
    if (validNodes.length) {
      console.log("Inserting valid nodes:", validNodes);
      $insertNodes(validNodes);
    } else {
      console.log("No valid nodes found, inserting plain text node.");
      $getRoot().append(
        $createParagraphNode().append($createTextNode(cleanHtml))
      );
    }
  });
};

const getNodesAsJson = (editor: LexicalEditor, html: string) => {
  const cleanHtml = html.trim();
  const wrappedHtml = `<html><body>${cleanHtml}</body></html>`;

  console.log("getNodesAsJson called with HTML:", cleanHtml);
  const dom = new DOMParser().parseFromString(wrappedHtml, "text/html");

  let nodesJson: any[] = [];
  editor.update(() => {
    const nodes = $generateNodesFromDOM(editor, dom);
    console.log("Generated nodes from DOM in getNodesAsJson:", nodes);

    function processNode(node: LexicalNode) {
      const json = node.exportJSON();
      console.log("Processing node:", node, "Exported JSON:", json);

      // Handle element nodes (paragraphs, headings, etc.)
      if ($isElementNode(node)) {
        json.children = node.getChildren().map((child) => {
          const childJson = child.exportJSON();
          console.log(
            "Processing child node:",
            child,
            "Exported JSON:",
            childJson
          );
          return childJson;
        });
      }

      // Handle text nodes directly
      if ($isTextNode(node)) {
        json.text = node.getTextContent();
        json.format = node.getFormat();
        console.log("Text node content:", json.text, "Format:", json.format);
      }

      return json;
    }

    nodesJson = nodes.map(processNode);
    console.log("Final nodesJson in getNodesAsJson:", nodesJson);
  });
  return nodesJson;
};
