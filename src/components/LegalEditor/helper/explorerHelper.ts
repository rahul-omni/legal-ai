import { FileSystemNodeProps } from "@/types/fileSystem";

export function findFileById(
  nodes: FileSystemNodeProps[],
  fileId: string | undefined
): FileSystemNodeProps | null {
  for (const node of nodes) {
    if (node.id === fileId && node.type === "FILE") return node;
    if (node.children) {
      const found = findFileById(node.children, fileId);
      if (found) return found;
    }
  }
  return null;
}
