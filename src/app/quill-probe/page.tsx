"use client";

import { useEffect, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export default function QuillTestPage() {
  const quillRef = useRef<any>(null);

  useEffect(() => {
    if (quillRef.current) {
      console.log("🚀 Quill wrapper instance:", quillRef.current);
      const editor = quillRef.current.getEditor();
      console.log("🚀 Quill editor instance:", editor);
    } else {
      console.error("Quill wrapper not ready");
    }
  }, []);

  return (
    <main className="max-w-2xl mx-auto py-10">
      <ReactQuill
        ref={(el: any) => (quillRef.current = el)}
        theme="snow"
        defaultValue="<p>Hello Quill!</p>"
        style={{ height: 200 }}
      />
    </main>
  );
}
