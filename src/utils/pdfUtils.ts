import { getDocument, PDFPageProxy } from "pdfjs-dist";
import pdf2md from "@opendocsg/pdf2md";
import { marked } from "marked";

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName?: string;
  fontSize?: number;
}

interface ImageItem {
  src: string;
  width: number;
  height: number;
}

interface ExtractedContent {
  text: string;
  images: ImageItem[];
  html: string;
}

// Helper function to determine if items are on the same line
const isSameLine = (
  item1: TextItem,
  item2: TextItem,
  threshold = 2
): boolean => {
  return Math.abs(item1.transform[5] - item2.transform[5]) <= threshold;
};

// Helper function to sort text items by position
const sortTextItems = (items: TextItem[]): TextItem[] => {
  return [...items].sort((a, b) => {
    // First sort by y-position (transform[5])
    if (Math.abs(a.transform[5] - b.transform[5]) > 2) {
      return b.transform[5] - a.transform[5]; // Higher y-value comes first (top to bottom)
    }
    // If on same line, sort by x-position (transform[4])
    return a.transform[4] - b.transform[4]; // Lower x-value comes first (left to right)
  });
};

// Helper function to group text items into lines and paragraphs
const organizeTextItems = (items: TextItem[]): string => {
  const sortedItems = sortTextItems(items);
  let result = "";
  let currentLine: TextItem[] = [];
  let lastY = 0;

  for (const item of sortedItems) {
    if (currentLine.length === 0 || isSameLine(currentLine[0], item)) {
      currentLine.push(item);
    } else {
      // Process completed line
      const lineText = currentLine.map((i) => i.str).join(" ");
      result += lineText;

      // Check if this might be a paragraph break
      const yDiff = Math.abs(lastY - item.transform[5]);
      if (yDiff > 5) {
        // Threshold for paragraph detection
        result += "\n\n"; // Paragraph break
      } else {
        result += " "; // Just a line break within paragraph
      }

      currentLine = [item];
      lastY = item.transform[5];
    }
  }

  // Add the last line
  if (currentLine.length > 0) {
    result += currentLine.map((i) => i.str).join(" ");
  }

  return result;
};

// Extract images from a PDF page
const extractImagesFromPage = async (
  page: PDFPageProxy
): Promise<ImageItem[]> => {
  const operatorList = await page.getOperatorList();
  const images: ImageItem[] = [];

  // Create a canvas for rendering
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const viewport = page.getViewport({ scale: 1.0 });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  for (let i = 0; i < operatorList.fnArray.length; i++) {
    if (operatorList.fnArray[i] === 93) {
      // 93 is the code for "paintImageXObject"
      const imgIndex = operatorList.argsArray[i][0];
      try {
        const img = await page.objs.get(imgIndex);

        if (img && img.src) {
          // Draw image on canvas to get its data
          context?.drawImage(img, 0, 0);
          const imgData = canvas.toDataURL();

          images.push({
            src: imgData,
            width: img.width,
            height: img.height,
          });
        }
      } catch (e) {
        console.error("Error extracting image:", e);
      }
    }
  }

  return images;
};

/**
 * Converts a PDF File/Blob to HTML by first extracting Markdown using pdf2md, then converting it to HTML.
 */
export const extractTextFromPDF = async (file: File | Blob): Promise<{ html: string }> => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Convert PDF to markdown
  const markdown: string = await pdf2md(buffer, {});

  // Convert markdown to HTML
  const html: string = await marked(markdown);

  return { html: `<div class="docx-document">${html}</div>` };
};

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });

interface TextItem {
  str: string;
  dir: string;
  transform: number[];
  fontName?: string;
  height: number;
  width: number;
}

interface TextContent {
  items: TextItem[];
  styles: Record<string, any>;
}

export async function extractPDFWithFormatting(url: string) {
  const loadingTask = getDocument(url);
  const pdf = await loadingTask.promise;

  const pagesData = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = (await page.getTextContent()) as TextContent;
    const viewport = page.getViewport({ scale: 1.0 });

    const pageData = {
      pageNumber: i,
      content: [] as Array<{
        text: string;
        styles: {
          bold?: boolean;
          italic?: boolean;
          heading?: number;
          listItem?: boolean;
          table?: boolean;
          fontSize?: number;
        };
        boundingBox: {
          x: number;
          y: number;
          width: number;
          height: number;
        };
      }>,
    };

    // Group text items by line
    const lines: Record<string, TextItem[]> = {};

    textContent.items.forEach((item) => {
      const tx = item.transform[4];
      const ty = item.transform[5];
      const lineKey = `${Math.round(ty)}`;

      if (!lines[lineKey]) lines[lineKey] = [];
      lines[lineKey].push(item);
    });

    // Process each line
    Object.entries(lines).forEach(([yPos, items]) => {
      const sortedItems = items.sort((a, b) => a.transform[4] - b.transform[4]);
      let combinedText = "";
      const styles = {
        bold: false,
        italic: false,
        heading: 0,
        listItem: false,
        table: false,
      };

      sortedItems.forEach((item) => {
        // Detect styles based on font name or other characteristics
        const fontName = item.fontName!.toLowerCase();
        styles.bold = styles.bold || fontName.includes("bold");
        styles.italic =
          styles.italic ||
          fontName.includes("italic") ||
          fontName.includes("oblique");

        // Detect headings based on font size and position
        if (item.height > 14) {
          styles.heading = item.height > 20 ? 1 : 2;
        }

        // Detect list items (simple bullet point detection)
        if (item.str.trim().match(/^[-•*]\s/)) {
          styles.listItem = true;
        }

        combinedText += item.str;
      });

      // Get bounding box
      const firstItem = sortedItems[0];
      const lastItem = sortedItems[sortedItems.length - 1];
      const width =
        lastItem.transform[4] + lastItem.width - firstItem.transform[4];

      pageData.content.push({
        text: combinedText,
        styles,
        boundingBox: {
          x: firstItem.transform[4],
          y: parseFloat(yPos),
          width,
          height: firstItem.height,
        },
      });
    });

    // Detect tables (simplified approach)
    detectTables(pageData);

    pagesData.push(pageData);
  }

  return pagesData;
}

function detectTables(pageData: any) {
  // Implement table detection logic based on text alignment and positions
  // This is a simplified version - you might need a more sophisticated approach
  const tableCandidates = pageData.content.filter(
    (item: any) =>
      item.text.includes("|") ||
      (item.boundingBox.x > 100 && item.text.trim().length > 30)
  );

  if (tableCandidates.length > 5) {
    tableCandidates.forEach((item: any) => {
      item.styles.table = true;
    });
  }
}

export async function extractPdfToHtml(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await getDocument({ data: arrayBuffer }).promise;

  let htmlContent = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    // Group text items by line (y-position)
    const lines: Record<string, any[]> = {};

    textContent.items.forEach((item: any) => {
      const lineKey = Math.round(item.transform[5]).toString();
      if (!lines[lineKey]) lines[lineKey] = [];
      lines[lineKey].push(item);
    });

    // Process each line
    const pageHtml = Object.keys(lines)
      .sort((a, b) => parseInt(b) - parseInt(a)) // Process from top to bottom
      .map((yPos) => {
        const lineItems = lines[yPos].sort(
          (a, b) => a.transform[4] - b.transform[4]
        );
        let lineText = "";
        const currentStyles = {
          bold: false,
          italic: false,
          heading: 0,
        };

        lineItems.forEach((item) => {
          // Detect styles
          const fontName = item.fontName.toLowerCase();
          const isBold = fontName.includes("bold");
          const isItalic =
            fontName.includes("italic") || fontName.includes("oblique");
          const isHeading = item.height > 14;
          const headingLevel = item.height > 20 ? 1 : 2;

          // Apply style changes
          if (isBold !== currentStyles.bold) {
            lineText += currentStyles.bold ? "</strong>" : "<strong>";
            currentStyles.bold = isBold;
          }
          if (isItalic !== currentStyles.italic) {
            lineText += currentStyles.italic ? "</em>" : "<em>";
            currentStyles.italic = isItalic;
          }

          if (isHeading && headingLevel !== currentStyles.heading) {
            lineText += currentStyles.heading
              ? `</h${currentStyles.heading}>`
              : "";
            currentStyles.heading = headingLevel;
            lineText += `<h${headingLevel}>`;
          }

          lineText += item.str;
        });

        // Close any open tags
        if (currentStyles.bold) lineText += "</strong>";
        if (currentStyles.italic) lineText += "</em>";
        if (currentStyles.heading) lineText += `</h${currentStyles.heading}>`;

        // Detect lists (simple bullet point detection)
        if (lineText.trim().match(/^[-•*]\s/)) {
          return `<li>${lineText.replace(/^[-•*]\s/, "")}</li>`;
        }

        // Detect paragraphs (default)
        return `<p>${lineText}</p>`;
      })
      .join("");

    htmlContent += `<div class="pdf-page" data-page="${i}">${pageHtml}</div>`;
  }

  return htmlContent;
}
