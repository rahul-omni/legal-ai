import { $generateNodesFromDOM } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Diff, diff, DiffArray } from "deep-diff";
import type {
  ParagraphNode,
  SerializedElementNode,
  SerializedLexicalNode,
  SerializedTextNode,
} from "lexical";
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

// Extended serialized node types with proper typing
interface SerializedNodeWithChildren extends SerializedLexicalNode {
  children?: SerializedNodeWithChildren[];
  text?: string; // For text nodes
  type: string;
}

interface SerializedTextNodeWithText extends SerializedTextNode {
  text: string;
}

interface SerializedElementNodeWithChildren extends SerializedElementNode {
  children: SerializedNodeWithChildren[];
}

// Type guards for better type safety
function isSerializedTextNode(
  node: SerializedNodeWithChildren
): node is SerializedTextNodeWithText {
  return node.type === "text" && typeof (node as any).text === "string";
}

function isSerializedElementNode(
  node: SerializedNodeWithChildren
): node is SerializedElementNodeWithChildren {
  return (
    node.type === "paragraph" ||
    node.type === "heading" ||
    node.type === "quote"
  );
}

// Deep-diff type helpers
type DiffType = Diff<
  SerializedNodeWithChildren[],
  SerializedNodeWithChildren[]
>;
type DiffArrayType = DiffArray<SerializedNodeWithChildren[]>;

// Enhanced diff type that includes both regular diffs and array diffs
type EnhancedDiffType = DiffType | DiffArrayType;

// Type guard to check if a diff is an array diff
function isDiffArray(diff: any): diff is DiffArrayType {
  return (
    diff && diff.kind === "A" && typeof diff.index === "number" && diff.item
  );
}

// Logging utility
const logDiff = (message: string, data?: any) => {
  console.log(
    `%c[DiffHighlightPlugin] ${message}`,
    "color: #007acc; font-weight: bold;",
    data
  );
};

export function DiffHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  const {
    docEditorState: { showDiffHighlight, activeTabId, openTabs, tabHistory },
  } = useDocumentEditor();

  useEffect(() => {
    logDiff("Plugin effect triggered", { showDiffHighlight, activeTabId });

    const oldHtmlContent =
      openTabs.find((tab) => tab.id === activeTabId)?.content || "";

    const newHtmlContent =
      tabHistory.find((tab) => tab.id === activeTabId)?.content || "";

    logDiff("HTML content retrieved", {
      oldLength: oldHtmlContent.length,
      newLength: newHtmlContent.length,
    });

    if (!showDiffHighlight) {
      const changeToShow = newHtmlContent || oldHtmlContent;
      logDiff("Showing content without diff", {
        contentLength: changeToShow.length,
      });
      convertNodesFromHtml(editor, changeToShow);
      return;
    }

    if (showDiffHighlight) {
      logDiff("Processing diff highlight");
      const oldNodesJson = getNodesAsJson(editor, oldHtmlContent);
      const newNodesJson = getNodesAsJson(editor, newHtmlContent);

      logDiff("Nodes extracted for diff", {
        oldNodesCount: oldNodesJson.length,
        newNodesCount: newNodesJson.length,
      });
      const delta: EnhancedDiffType[] | undefined = diff(
        oldNodesJson,
        newNodesJson
      ) as EnhancedDiffType[];

      logDiff("Calculated diff", delta);

      if (!delta || delta.length === 0) {
        logDiff("No differences found, showing new content");
        convertNodesFromHtml(editor, newHtmlContent);
        return;
      }

      const summary = summarizeDiffProcessing(delta);
      logDiff("Diff processing summary", summary);
      processDeltaChanges(editor, newNodesJson, delta);
    }
  }, [showDiffHighlight, activeTabId, openTabs, tabHistory]);

  return null;
}

function groupDeltaChanges(delta: EnhancedDiffType[]) {
  const nodeChanges = new Map<number, EnhancedDiffType[]>();
  const arrayChanges: EnhancedDiffType[] = [];

  for (const change of delta) {
    if (isDiffArray(change)) {
      const nodeIndex = change.index as number;
      if (typeof nodeIndex === "number") {
        if (!nodeChanges.has(nodeIndex)) nodeChanges.set(nodeIndex, []);
        nodeChanges.get(nodeIndex)?.push(change);
      } else {
        arrayChanges.push(change);
      }
    } else {
      const nodeIndex = (change as DiffType).path?.[0];
      if (typeof nodeIndex !== "number") continue;
      if (!nodeChanges.has(nodeIndex)) nodeChanges.set(nodeIndex, []);
      nodeChanges.get(nodeIndex)?.push(change);
    }
  }

  return { nodeChanges, arrayChanges };
}

function createHighlightedTextNode(
  text: string,
  color: string,
  strike = false
) {
  const node = $createTextNode(text);
  const style = `background-color: ${color};${strike ? " text-decoration: line-through;" : ""}`;
  node.setStyle(style);
  return node;
}

function handleArrayAddition(paragraph: ParagraphNode, newNodeData: any) {
  for (const child of newNodeData.children || [newNodeData]) {
    if (child.type === "text" && child.text) {
      paragraph.append(createHighlightedTextNode(child.text, "#d4f8e8"));
    } else if (child.type === "linebreak") {
      paragraph.append($createLineBreakNode());
    }
  }
}

function applyChangesToChild(
  paragraph: ParagraphNode,
  change: EnhancedDiffType
) {
  try {
    switch (change.kind) {
      case "N":
        if ((change as any).rhs?.text) {
          paragraph.append(
            createHighlightedTextNode((change as any).rhs.text, "#d4f8e8")
          );
        }
        break;
      case "E":
        if ((change as any).rhs) {
          paragraph.append(
            createHighlightedTextNode((change as any).rhs, "#fff3cd")
          );
        }
        break;
      case "D":
        if ((change as any).lhs?.text) {
          paragraph.append(
            createHighlightedTextNode((change as any).lhs.text, "#ffeaea", true)
          );
        }
        break;
    }
  } catch (error) {
    logDiff("Error applying child change", { change, error });
  }
}

export function processDeltaChanges(
  editor: LexicalEditor,
  newNodes: SerializedNodeWithChildren[],
  delta: EnhancedDiffType[]
) {
  logDiff("Processing delta changes", {
    deltaLength: delta.length,
    newNodesLength: newNodes.length,
  });

  editor.update(() => {
    const root = $getRoot();
    root.clear();

    const { nodeChanges, arrayChanges } = groupDeltaChanges(delta);
    logDiff("Grouped changes by node", {
      groupCount: nodeChanges.size,
      arrayChangesCount: arrayChanges.length,
    });

    newNodes.forEach((node, nodeIndex) => {
      const paragraph = $createParagraphNode();
      const changes = nodeChanges.get(nodeIndex) || [];

      const arrayAddition = changes.find((c) => isDiffArray(c));
      if (arrayAddition?.item.kind === "N") {
        handleArrayAddition(paragraph, arrayAddition.item.rhs);
        root.append(paragraph);
        return;
      }

      if (isSerializedElementNode(node) && node.children) {
        node.children.forEach((child, childIndex) => {
          const childChanges = changes.filter(
            (c) => c.path?.[1] === "children" && c.path?.[2] === childIndex
          );
          if (childChanges.length > 0) {
            childChanges.forEach((change) =>
              applyChangesToChild(paragraph, change)
            );
          } else {
            if (isSerializedTextNode(child)) {
              paragraph.append($createTextNode(child.text));
            } else if (child.type === "linebreak") {
              paragraph.append($createLineBreakNode());
            }
          }
        });
      } else if (isSerializedTextNode(node)) {
        paragraph.append($createTextNode(node.text));
      }

      root.append(paragraph);
    });

    arrayChanges.forEach((arrayChange: any) => {
      if (isDiffArray(arrayChange) && arrayChange.item?.kind === "N") {
        const paragraph = $createParagraphNode();
        handleArrayAddition(paragraph, arrayChange.item.rhs);
        root.append(paragraph);
      }
    });

    const deletedNodes = delta.filter(
      (d: any) => d.kind === "D" && d.path?.length === 1 && d.lhs?.text
    );

    deletedNodes.forEach((deletion: any) => {
      const paragraph = $createParagraphNode();
      const textNode = createHighlightedTextNode(
        deletion.lhs.text,
        "#ffeaea",
        true
      );
      paragraph.append(textNode);
      root.append(paragraph);
    });

    logDiff("Finished processing delta changes");
  });
}

const convertNodesFromHtml = (editor: LexicalEditor, htmlContent: string) => {
  const cleanHtml = htmlContent.trim();
  const wrappedHtml = `<html><body>${htmlContent}</body></html>`;
  const dom = new DOMParser().parseFromString(wrappedHtml, "text/html");

  logDiff("convertNodesFromHtml called", { htmlLength: cleanHtml.length });

  editor.update(() => {
    $getRoot().clear();

    try {
      const nodes = $generateNodesFromDOM(editor, dom);
      logDiff("Generated nodes from DOM", { nodesCount: nodes.length });

      const validNodes = nodes.filter($isElementNode);

      if (validNodes.length) {
        logDiff("Inserting valid nodes", {
          validNodesCount: validNodes.length,
        });
        $insertNodes(validNodes);
      } else {
        logDiff("No valid nodes found, inserting plain text");
        $getRoot().append(
          $createParagraphNode().append($createTextNode(cleanHtml))
        );
      }
    } catch (error) {
      logDiff("Error in convertNodesFromHtml", error);
      // Fallback: create a simple text node
      $getRoot().append(
        $createParagraphNode().append($createTextNode(cleanHtml))
      );
    }
  });
};

const getNodesAsJson = (
  editor: LexicalEditor,
  html: string
): SerializedNodeWithChildren[] => {
  const cleanHtml = html.trim();
  const wrappedHtml = `<html><body>${cleanHtml}</body></html>`;

  logDiff("getNodesAsJson called", { htmlLength: cleanHtml.length });
  const dom = new DOMParser().parseFromString(wrappedHtml, "text/html");

  let nodesJson: SerializedNodeWithChildren[] = [];
  editor.update(() => {
    const nodes = $generateNodesFromDOM(editor, dom);

    function processNode(node: LexicalNode): SerializedNodeWithChildren {
      const json = node.exportJSON() as SerializedNodeWithChildren;

      // Handle element nodes (paragraphs, headings, etc.)
      if ($isElementNode(node)) {
        const children = node.getChildren().map((child) => {
          const childJson = processNode(child);
          return childJson;
        });

        // Cast to our extended type to add children
        (json as SerializedElementNodeWithChildren).children = children;
      }

      // Handle text nodes directly
      if ($isTextNode(node)) {
        const textContent = node.getTextContent();
        const format = node.getFormat();

        // Cast to our extended type to add text properties
        (json as SerializedTextNodeWithText).text = textContent;
        (json as any).format = format;
      }

      return json;
    }

    nodesJson = nodes.map(processNode);
    logDiff("Final nodesJson", { count: nodesJson.length, data: nodesJson });
  });

  return nodesJson;
};

// Helper function to provide summary of diff processing
const summarizeDiffProcessing = (delta: EnhancedDiffType[]) => {
  const summary = {
    totalChanges: delta.length,
    arrayAdditions: 0,
    arrayDeletions: 0,
    regularChanges: 0,
    newNodes: 0,
    editedNodes: 0,
    deletedNodes: 0,
  };

  delta.forEach((change) => {
    if (isDiffArray(change)) {
      if (change.item?.kind === "N") summary.arrayAdditions++;
      else if (change.item?.kind === "D") summary.arrayDeletions++;
    } else {
      summary.regularChanges++;
      if (change.kind === "N") summary.newNodes++;
      else if (change.kind === "E") summary.editedNodes++;
      else if (change.kind === "D") summary.deletedNodes++;
    }
  });

  return summary;
};
