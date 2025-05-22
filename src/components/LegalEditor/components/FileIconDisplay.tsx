import { File, FileIcon, FileText } from "lucide-react";

const FileIconDisplay = ({ fileName }: { fileName: string }) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "pdf":
      return (
        <div className="flex items-center justify-center text-[10px] font-medium bg-gray-100 text-gray-600/80 rounded w-5 h-5">
          PDF
        </div>
      );
    case "docx":
    case "doc":
      return <FileText className="w-4 h-4 text-blue-500/80" />;
    case "txt":
      return <File className="w-4 h-4 text-gray-500/80" />;
    default:
      return <FileIcon className="w-4 h-4 text-gray-400" />;
  }
};

export default FileIconDisplay;
