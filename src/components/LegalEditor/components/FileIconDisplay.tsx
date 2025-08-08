import { File, FileIcon, FileText } from "lucide-react";

const FileIconDisplay = ({ fileName }: { fileName: string }) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "pdf":
      return (
        <div className="flex items-center justify-center text-[10px] bg-gray-100 rounded w-5 h-5">
          PDF
        </div>
      );
    case "docx":
    case "doc":
      return <FileText className="w-6 h-6" />;
    case "txt":
      return <File className="w-6 h-6" />;
    default:
      return <FileIcon className="w-6 h-6" />;
  }
};

export default FileIconDisplay;
