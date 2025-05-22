import { getDocument } from "pdfjs-dist";

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let fullHtml = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(" ");
      fullHtml += `<p><strong>Page ${i}:</strong><br>${text.replace(/\n/g, "<br>")}</p>`;
    }

    return fullHtml;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw error;
  }
};
