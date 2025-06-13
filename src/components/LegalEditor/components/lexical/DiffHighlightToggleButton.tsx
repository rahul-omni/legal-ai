import { Eye, EyeOff } from "lucide-react";
import { useDocumentEditor } from "../../reducersContexts/documentEditorReducerContext";

export const DiffHighlightToggleButton = () => {
  const {
    docEditorState: { showDiffHighlight },
    docEditorDispatch,
  } = useDocumentEditor();

  return (
    <button
      onClick={() => docEditorDispatch({ type: "TOGGLE_DIFF_HIGHLIGHT" })}
      className={"toolbar-item spaced " + (showDiffHighlight ? "active" : "")}
      aria-label={
        showDiffHighlight ? "Hide Diff Highlights" : "Show Diff Highlights"
      }
      title={
        showDiffHighlight
          ? "Hide changes highlighting"
          : "Show changes highlighting"
      }
    >
      {showDiffHighlight ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
};
