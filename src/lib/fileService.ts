import mammoth from "mammoth";
// Add to FileService.ts
import * as pdfjsLib from 'pdfjs-dist';
export interface FileData {
  id: string;
  name: string;
  content: string;
  type: string;
  parentId: string | null;
  children?: FileData[];
}

export class FileService {

   // Add this new method for PDF validation
   static async validatePDF(arrayBuffer: ArrayBuffer): Promise<boolean> {
  try {
    // Basic validation - check minimum PDF header
    const header = new Uint8Array(arrayBuffer.slice(0, 4));
    return String.fromCharCode(...header) === '%PDF';
  } catch (error) {
    console.error('PDF validation failed:', error);
    return false;
  }
}
  static async parseFile(file: File): Promise<string> {
    const fileName = file.name.toLowerCase();
    console.log(
      "[FileService] Starting to parse file:",
      fileName,
      "Type:",
      file.type
    );

    // Handle Word documents
    if (fileName.endsWith(".docx")) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        //  const result = await mammoth.extractRawText({ arrayBuffer });
        const result = await mammoth.convertToHtml({ arrayBuffer });
        return result.value;
      } catch (error) {
        console.error("Error parsing Word document:", error);
        throw new Error(
          "Failed to parse Word document. Please save the file in .docx format."
        );
      }
    }

    // Handle old .doc files
    if (fileName.endsWith(".doc")) {
      throw new Error(
        "This appears to be an older Word format (.doc). Please save the file as .docx and try again."
      );
    }

    // Handle PDF files
    if (file.type.endsWith(".pdf")  || file.type === "application/pdf") {
      console.log("[FileService] Processing PDF file...");


      try {
     
      // Choose either:
       const arrayBuffer = await file.arrayBuffer();
       // First validate the PDF
    if (!(await this.validatePDF(arrayBuffer))) {
      throw new Error('Invalid PDF file');
    }
    
    // Use cached version if available
    return await this.parsePDFWithCache(arrayBuffer);
      // OR Option 2: Get raw text (simpler but less formatting)
      // const text = await this.extractTextFromPDF(file);
      // return `<div class="pdf-content">${text}</div>`;
    } catch (error) {
      console.error("PDF parsing error:", error);
      throw error;
    }
      
    }

    // Default to text files
    return file.text();
  }

 

private static pdfCache = new Map<string, string>();

static async parsePDFWithCache(arrayBuffer: ArrayBuffer): Promise<string> {
  const hash = await this.arrayBufferToHash(arrayBuffer);
  
  if (this.pdfCache.has(hash)) {
    return this.pdfCache.get(hash)!;
  }
  
  const html = await this.parsePDFToQuillHTML(arrayBuffer);
  this.pdfCache.set(hash, html);
  return html;
}

private static async arrayBufferToHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


// In FileService.ts
static async parsePDFToQuillHTML(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let html = '<div class="ql-editor">';
    const LINE_HEIGHT_THRESHOLD = 5; // Adjust based on your PDFs
    
    for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent({
        disableCombineTextItems: false,
        includeMarkedContent: true
      });
      
      let lastY = 0;
      let currentParagraph = '';
      let currentStyles: any = {};
      
      // Process each text item
      for (const item of textContent.items) {
        if ('str' in item) {
          const y = item.transform[5];
          const text = item.str;
          
          // Detect paragraph breaks (significant vertical movement)
          if (Math.abs(y - lastY) > LINE_HEIGHT_THRESHOLD && currentParagraph) {
            html += this.wrapParagraph(currentParagraph, currentStyles);
            currentParagraph = '';
            currentStyles = {};
          }
          
          // Detect styling
          const styles = this.detectTextStyles(item);
          
          // Apply styling if different from current
          if (JSON.stringify(styles) !== JSON.stringify(currentStyles)) {
            if (currentParagraph) {
              currentParagraph += `</span>`;
            }
            currentStyles = styles;
            if (Object.keys(styles).length > 0) {
              currentParagraph += `<span style="${Object.entries(styles)
                .map(([k, v]) => `${k}:${v}`)
                .join(';')}">`;
            }
          }
          
          currentParagraph += text;
          lastY = y;
        }
      }
      
      // Add remaining content
      if (currentParagraph) {
        html += this.wrapParagraph(currentParagraph, currentStyles);
      }
      
      // Add page break if needed
      if (i < pdf.numPages) {
        html += '<p style="page-break-after: always;"></p>';
      }
    }
    
    return html + '</div>';
  } catch (error) {
    console.error('PDF to HTML conversion failed:', error);
    throw error;
  }
}

private static wrapParagraph(text: string, styles: any): string {
  // Detect headings based on font size
  const { width, 'max-width': maxWidth, ...cleanStyles } = styles;
  
  // Use 100% width for all content
  const paragraphStyles = {
    margin: '0 0 8px 0',
    width: '100%',
    ...cleanStyles
  };
   return `<p style="${Object.entries(paragraphStyles)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}">${text}</p>`;

  // const fontSize = styles['font-size'];
  // if (fontSize && parseFloat(fontSize) >= 1.5) {
  //   return `<h2 style="${Object.entries(styles)
  //     .map(([k, v]) => `${k}:${v}`)
  //     .join(';')}">${text}</h2>`;
  // }
  
  // // Regular paragraph
  // return `<p style="margin: 0 0 8px 0; ${Object.entries(styles)
  //   .map(([k, v]) => `${k}:${v}`)
  //   .join(';')}">${text}</p>`;
}

private static detectTextStyles(item: any): Record<string, string> {
  const styles: Record<string, string> = {};
  
  // Font weight (bold)
  if (item.fontName.includes('Bold') || item.fontWeight >= 700) {
    styles['font-weight'] = 'bold';
  }
  
  // Font style (italic)
  if (item.fontName.includes('Italic') || item.fontName.includes('Oblique')) {
    styles['font-style'] = 'italic';
  }
  
  // Font size (relative to transform matrix)
  const fontSize = Math.round(item.transform[0]);
  if (fontSize > 16) styles['font-size'] = '1.5em';
  else if (fontSize > 12) styles['font-size'] = '1.2em';
  
  // Text color (if available)
  if (item.color && item.color.length === 3) {
    const [r, g, b] = item.color.map((c: number) => Math.round(c * 255));
    styles['color'] = `rgb(${r},${g},${b})`;
  }
  
  return styles;
}
}
