import React, { forwardRef, useImperativeHandle, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "../styles/editor.css";

interface QuillEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onSelectionChange?: (range: { index: number; length: number } | null) => void;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["clean"],
  ],
  clipboard: {
    matchVisual: false,
  },
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "bullet",
  "indent",
];

export const QuillEditor = forwardRef<any, QuillEditorProps>(
  ({ content, onContentChange, onSelectionChange }, ref) => {
    const innerQuillRef = useRef<any>(null);

    // Expose .getEditor() to parent via ref
    useImperativeHandle(ref, () => ({
      getEditor: () => innerQuillRef.current?.getEditor?.(),
    }));

    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="relative flex-1">
          <div className="absolute inset-0 bg-white shadow-paper transform-gpu perspective-1000 editor-container">
            <ReactQuill
              ref={innerQuillRef}
              theme="snow"
              value={content}
              onChange={onContentChange}
              onChangeSelection={onSelectionChange}
              modules={modules}
              formats={formats}
              className="h-full"
              preserveWhitespace={true}
            />
          </div>
        </div>
      </div>
    );
  }
);

QuillEditor.displayName = "QuillEditor";
