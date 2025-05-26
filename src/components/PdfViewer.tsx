import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';

// Initialize worker
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

const PdfViewer = ({ content }: { content: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPDF = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate content
      if (!content) {
        throw new Error('No PDF content provided');
      }

      let pdfData;
      
      // Handle different content types
      if (content.startsWith('data:application/pdf;base64,')) {
        // Base64 with data URI
        const base64Content = content.split(',')[1];
        pdfData = { data: Uint8Array.from(atob(base64Content), c => c.charCodeAt(0) )};
      } else if (/^[A-Za-z0-9+/=]+$/.test(content)) {
        // Raw base64 without prefix
        pdfData = { data: Uint8Array.from(atob(content), c => c.charCodeAt(0)) };
      } else if (content.startsWith('%PDF-')) {
        // Raw PDF data
        pdfData = { data: new TextEncoder().encode(content) };
      } else {
        // Assume URL
        pdfData = { url: content };
      }

      // Load PDF document
      const pdf = await getDocument(pdfData).promise;
      setNumPages(pdf.numPages);

      // Render current page
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Adjust canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Clear previous render
        context?.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render page
        await page.render({
          canvasContext: context!,
          viewport
        }).promise;
      }
    } catch (err) {
      console.error('PDF rendering error:', err);
      setError(`Failed to render PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPDF();
  }, [content, currentPage, scale]);

  return (
    <div className="pdf-viewer-container">
      {error && (
        <div className="bg-red-100 text-red-800 p-2 mb-2 rounded">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p>Loading PDF...</p>
        </div>
      ) : (
        <>
          <div className="pdf-controls flex gap-2 mb-4">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="self-center">
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
            <button 
              onClick={() => setScale(s => s + 0.1)}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Zoom In
            </button>
            <button 
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Zoom Out
            </button>
          </div>
          <div className="pdf-canvas-container overflow-auto border border-gray-300">
            <canvas ref={canvasRef} />
          </div>
        </>
      )}
    </div>
  );
};

export default PdfViewer;