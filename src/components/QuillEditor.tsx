import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "../styles/editor.css";
 

interface QuillEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onSelectionChange?: (range: { index: number; length: number } | null) => void;
}

<<<<<<< HEAD



// const modules = {
//   toolbar: [
//     // Headers
//     [{ header: [1, 2, false] }],

//     // Text styling
//     ["bold", "italic", "underline"],

//     // Lists and indentation
//     [{ list: "ordered" }, { list: "bullet" }],
//     [{ indent: "-1" }, { indent: "+1" }],

//     // Clean formatting
//     ["clean"],
//   ],
//   clipboard: {
//     matchVisual: false,
//   },
// };

// const formats = [
//   "header",
//   "bold",
//   "italic",
//   "underline",
//   "list", // Includes "bullet" and "ordered"
//   "bullet",
//   "indent",
// ];

=======
// Update the font list in both places
const fontList = [
  'arial', 
  'times-new-roman', 
  'georgia', 
  'courier-new',
  'comic-sans',
  'pacifico',
  'lobster',
  'impact',
  'dancing-script',
  'montserrat',
  'open-sans',
  'oswald',
  'playfair-display',
  'raleway',
  'roboto-slab'
];

// Define the Quill modules with toolbar options
>>>>>>> 0cc9339 (mostly css changes)
const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    [{ font: fontList }],
    [{ size: ["small", false, "large", "huge"] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }], // ✅ alignment
    ["clean"],
  ],
  clipboard: {
    matchVisual: false,
  },
};

const formats = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "list",
  "bullet",
  "indent",
  "align", // ✅ make sure Quill recognizes alignment
];


export const QuillEditor = forwardRef<any, QuillEditorProps>(
  ({ content, onContentChange, onSelectionChange }, ref) => {
    const innerQuillRef = useRef<any>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // Register fonts when the component mounts
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const Quill = ReactQuill.Quill;
        if (Quill) {
          try {
            // Register font format
            const Font = Quill.import('formats/font');
            // Set whitelist of font names
            Font.whitelist = fontList;
            Quill.register(Font, true);
          } catch (error) {
            console.error("Error registering Quill fonts:", error);
          }
        }
      }
    }, []);

    // Handle font changes to prevent UI breaking
    const handleEditorChange = (value: string) => {
      // Ensure the editor container maintains its dimensions
      if (editorContainerRef.current) {
        editorContainerRef.current.style.height = '100%';
      }
      
      // Pass the content change to the parent component
      onContentChange(value);
    };

    // Expose .getEditor() to parent via ref
    useImperativeHandle(ref, () => ({
      getEditor: () => innerQuillRef.current?.getEditor?.(),
    }));

    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="relative flex-1">
          <div 
            ref={editorContainerRef}
            className="absolute inset-0 bg-white shadow-paper transform-gpu perspective-1000 editor-container"
          >
            <ReactQuill
              ref={innerQuillRef}
              theme="snow"
              value={content}
              onChange={handleEditorChange}
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
