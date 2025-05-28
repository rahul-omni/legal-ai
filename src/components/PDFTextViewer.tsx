import { useEffect, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

const PDFTextViewer = ({ content }: { content: string }) => {
  const [formattedContent, setFormattedContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const extractFormattedText = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // If content is already HTML (fallback content), use it directly
        if (content.startsWith("<") || !content.startsWith("data:application/pdf")) {
          setFormattedContent(content);
          return;
        }

        const base64Content = content.split(",")[1];
        if (!base64Content) {
          throw new Error("Invalid PDF data format");
        }

        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length)
          .fill(0)
          .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);

        const pdf = await getDocument({ data: byteArray }).promise;
        let fullHtml = "<div class='pdf-content'>";

        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          fullHtml += `<div class="pdf-page">`;
          
          textContent.items.forEach((item) => {
            if ("str" in item) {
              const text = item.str.trim();
              if (text) {
                fullHtml += `<p>${text}</p>`;
              }
            }
          });
          
          fullHtml += `</div>`;
        }

        fullHtml += "</div>";
        setFormattedContent(fullHtml);
      } catch (err) {
        console.error("PDF parsing error:", err);
        setError("Failed to fully parse PDF. Showing raw content.");
        setFormattedContent(content);
      } finally {
        setIsLoading(false);
      }
    };

    extractFormattedText();
  }, [content]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading PDF content...</p>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-container">
      {error && (
        <div className="bg-yellow-100 text-yellow-800 p-2 mb-4 rounded">
          {error}
        </div>
      )}
      <div
        className="pdf-content"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    </div>
  );
};

export default PDFTextViewer;