// components/DocumentDiffViewer.tsx
import * as diffMatchPatch from "diff-match-patch";
import { useEffect, useRef, useState } from "react";

const dmp = new diffMatchPatch.diff_match_patch();

interface DocumentDiffViewerProps {
  oldText: string;
  newText: string;
  onClose: () => void;
}

export function DocumentDiffViewer({
  oldText,
  newText,
  onClose,
}: DocumentDiffViewerProps) {
  const [htmlDiff, setHtmlDiff] = useState("");
  const diffContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const diffs = dmp.diff_main(oldText, newText);
    dmp.diff_cleanupSemantic(diffs);
    const html = dmp.diff_prettyHtml(diffs);
    setHtmlDiff(html);
  }, [oldText, newText]);

  return (
    <div className="diff-container">
      <div className="diff-toolbar">
        <h3>Document Comparison</h3>
        <button onClick={onClose}>Close</button>
      </div>
      <div
        ref={diffContainerRef}
        className="diff-content"
        dangerouslySetInnerHTML={{ __html: htmlDiff }}
      />
    </div>
  );
}
