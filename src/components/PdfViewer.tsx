
import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

const PdfViewer = ({ content }: { content: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadPDF = async () => {
  setIsLoading(true);
  try {
    let pdfData;

    if (content.startsWith('data:')) {
      const base64Content = content.split(',')[1];
      const byteCharacters = atob(base64Content);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      pdfData = { data: byteArray };
    } else if (/^[A-Za-z0-9+/=]+$/.test(content)) {
      // Base64 without data URI prefix
      const byteCharacters = atob(content);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      pdfData = { data: byteArray };
    } else {
      // Assume it's a URL
      pdfData = { url: content };
    }

    const pdf = await getDocument(pdfData).promise;
    setNumPages(pdf.numPages);

    const page = await pdf.getPage(currentPage);
    const viewport = page.getViewport({ scale });

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context!,
        viewport
      }).promise;
    }
  } catch (error) {
    console.error('PDF rendering error:', error);
  } finally {
    setIsLoading(false);
  }
};


    loadPDF();
  }, [content, currentPage, scale]);

  return (
    <div className="pdf-viewer-container">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p>Loading PDF...</p>
        </div>
      ) : (
        <>
          <div className="pdf-controls mb-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {numPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
            >
              Next
            </button>
            <button onClick={() => setScale(s => s + 0.1)}>Zoom In</button>
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>Zoom Out</button>
          </div>
          <div className="pdf-canvas-container">
            <canvas ref={canvasRef} className="border border-gray-300" />
          </div>
        </>
      )}
    </div>
  );
};


export default PdfViewer;