import { $getRoot } from "lexical";

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
  const handleShowDiff = () => {};

  return (
    <>
      <button onClick={handleShowDiff} className="diff-button">
        Compare Versions
      </button>
    </>
  );
}
