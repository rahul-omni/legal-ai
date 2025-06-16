import { $generateNodesFromDOM } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Diff, diff, DiffNew, DiffDeleted, DiffEdit, DiffArray } from "deep-diff";
import type { SerializedLexicalNode, SerializedTextNode, SerializedElementNode } from "lexical";
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
function isSerializedTextNode(node: SerializedNodeWithChildren): node is SerializedTextNodeWithText {
  return node.type === "text" && typeof (node as any).text === "string";
}

function isSerializedElementNode(node: SerializedNodeWithChildren): node is SerializedElementNodeWithChildren {
  return node.type === "paragraph" || node.type === "heading" || node.type === "quote";
}

// Deep-diff type helpers
type DiffType = Diff<SerializedNodeWithChildren[], SerializedNodeWithChildren[]>;
type DiffArrayType = DiffArray<SerializedNodeWithChildren[]>;

// Logging utility
const logDiff = (message: string, data?: any) => {
  console.log(`%c[DiffHighlightPlugin] ${message}`, "color: #007acc; font-weight: bold;", data);
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
      newLength: newHtmlContent.length 
    });

    if (!showDiffHighlight) {
      const changeToShow = newHtmlContent || oldHtmlContent;
      logDiff("Showing content without diff", { contentLength: changeToShow.length });
      convertNodesFromHtml(editor, changeToShow);
      return;
    }

    if (showDiffHighlight) {
      logDiff("Processing diff highlight");
      const oldNodesJson = getNodesAsJson(editor, oldHtmlContent);
      const newNodesJson = getNodesAsJson(editor, newHtmlContent);

      logDiff("Nodes extracted for diff", { 
        oldNodesCount: oldNodesJson.length, 
        newNodesCount: newNodesJson.length 
      });

      const delta: DiffType[] | undefined = diff(
        oldNodesJson,
        newNodesJson
      );

      logDiff("Calculated diff", delta);

      if (!delta || delta.length === 0) {
        logDiff("No differences found, showing new content");
        convertNodesFromHtml(editor, newHtmlContent);
        return;
      }

      processDeltaChanges(editor, newNodesJson, delta);
    }
  }, [showDiffHighlight, activeTabId, openTabs, tabHistory]);

  return null;
}

function processDeltaChanges(
  editor: LexicalEditor,
  newNodes: SerializedNodeWithChildren[],
  delta: DiffType[]
) {
  logDiff("Processing delta changes", { deltaLength: delta.length, newNodesLength: newNodes.length });
  
  editor.update(() => {
    const root = $getRoot();
    root.clear();

    // Group changes by node path
    const nodeChanges = new Map<number, DiffType[]>();

    delta.forEach((change) => {
      if (!change.path || change.path.length === 0) {
        logDiff("Skipping change with invalid path", change);
        return;
      }
      
      const nodeIndex = change.path[0] as number;
      if (typeof nodeIndex !== 'number') {
        logDiff("Skipping change with non-numeric node index", change);
        return;
      }

      if (!nodeChanges.has(nodeIndex)) {
        nodeChanges.set(nodeIndex, []);
      }
      nodeChanges.get(nodeIndex)?.push(change);
    });

    logDiff("Grouped changes by node", { groupCount: nodeChanges.size });

    // Process each node
    newNodes.forEach((node, nodeIndex) => {
      const paragraph = $createParagraphNode();
      const changes = nodeChanges.get(nodeIndex) || [];

      logDiff(`Processing node ${nodeIndex}`, { 
        nodeType: node.type, 
        changesCount: changes.length,
        hasChildren: !!node.children
      });

      // Handle element nodes with children
      if (isSerializedElementNode(node) && node.children) {
        node.children.forEach((child: SerializedNodeWithChildren, childIndex: number) => {
          // Find changes for this specific child
          const childChanges = changes.filter(
            (c) => c.path && c.path.length >= 3 && c.path[1] === "children" && c.path[2] === childIndex
          );

          logDiff(`Processing child ${childIndex}`, { 
            childType: child.type, 
            childChangesCount: childChanges.length 
          });

          if (childChanges.length > 0) {
            // Handle changed content
            childChanges.forEach((change) => {
              try {
                if (change.kind === "N") {
                  // New item added
                  const newChange = change as any;
                  if (newChange.rhs && typeof newChange.rhs === 'object' && newChange.rhs.text) {
                    const textNode = $createTextNode(String(newChange.rhs.text));
                    textNode.setStyle("background-color: #d4f8e8;");
                    paragraph.append(textNode);
                    logDiff("Added new text node", { text: newChange.rhs.text });
                  }
                } else if (change.kind === "E") {
                  // Modified property
                  const editChange = change as any;
                  if (editChange.rhs && typeof editChange.rhs === 'string') {
                    const textNode = $createTextNode(editChange.rhs);
                    textNode.setStyle("background-color: #fff3cd;");
                    paragraph.append(textNode);
                    logDiff("Modified text content", { newText: editChange.rhs });
                  }
                } else if (change.kind === "D") {
                  // Deleted item
                  const deleteChange = change as any;
                  if (deleteChange.lhs && typeof deleteChange.lhs === 'object' && deleteChange.lhs.text) {
                    const textNode = $createTextNode(String(deleteChange.lhs.text));
                    textNode.setStyle("background-color: #ffeaea; text-decoration: line-through;");
                    paragraph.append(textNode);
                    logDiff("Deleted text node", { text: deleteChange.lhs.text });
                  }
                }
              } catch (error) {
                logDiff("Error processing change", { change, error });
              }
            });
          } else {
            // Unchanged content
            if (isSerializedTextNode(child)) {
              paragraph.append($createTextNode(child.text));
              logDiff("Added unchanged text", { text: child.text });
            } else if (child.type === "linebreak") {
              paragraph.append($createLineBreakNode());
              logDiff("Added line break");
            }
          }
        });
      } else if (isSerializedTextNode(node)) {
        // Handle direct text nodes
        paragraph.append($createTextNode(node.text));
        logDiff("Added direct text node", { text: node.text });
      }

      root.append(paragraph);
    });

    // Handle deleted nodes that are not part of the new structure
    const deletedNodes = delta.filter((d) => d.kind === "D" && d.path && d.path.length === 1);
    deletedNodes.forEach((deletion) => {
      try {
        const deleteChange = deletion as any;
        if (deleteChange.lhs && typeof deleteChange.lhs === 'object' && deleteChange.lhs.text) {
          const paragraph = $createParagraphNode();
          const textNode = $createTextNode(String(deleteChange.lhs.text));
          textNode.setStyle("background-color: #ffeaea; text-decoration: line-through;");
          paragraph.append(textNode);
          root.append(paragraph);
          logDiff("Added deleted node", { text: deleteChange.lhs.text });
        }
      } catch (error) {
        logDiff("Error processing deleted node", { deletion, error });
      }
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
        logDiff("Inserting valid nodes", { validNodesCount: validNodes.length });
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

const getNodesAsJson = (editor: LexicalEditor, html: string): SerializedNodeWithChildren[] => {
  const cleanHtml = html.trim();
  const wrappedHtml = `<html><body>${cleanHtml}</body></html>`;

  logDiff("getNodesAsJson called", { htmlLength: cleanHtml.length });
  const dom = new DOMParser().parseFromString(wrappedHtml, "text/html");

  let nodesJson: SerializedNodeWithChildren[] = [];
  editor.update(() => {
    const nodes = $generateNodesFromDOM(editor, dom);
    logDiff("Generated nodes from DOM", { nodesCount: nodes.length });

    function processNode(node: LexicalNode): SerializedNodeWithChildren {
      const json = node.exportJSON() as SerializedNodeWithChildren;
      logDiff("Processing node", { nodeType: node.getType(), json });

      // Handle element nodes (paragraphs, headings, etc.)
      if ($isElementNode(node)) {
        const children = node.getChildren().map((child) => {
          const childJson = processNode(child);
          logDiff("Processing child node", { childType: child.getType(), childJson });
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
        
        logDiff("Text node content", { text: textContent, format });
      }

      return json;
    }

    nodesJson = nodes.map(processNode);
    logDiff("Final nodesJson", { count: nodesJson.length, data: nodesJson });
  });
  
  return nodesJson;
};
