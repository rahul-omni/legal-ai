import mammoth from "mammoth";

export interface FileData {
  id: string;
  name: string;
  content: string;
  type: string;
  parentId: string | null;
  children?: FileData[];
}

export class FileService {
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
    if (file.type.includes("pdf")) {
      console.log("[FileService] Processing PDF file...");
      try {
        console.log("[FileService] Converting file to array buffer...");
        const arrayBuffer = await file.arrayBuffer();
        console.log("[FileService] Converting to base64...");
        const base64PDF = Buffer.from(arrayBuffer).toString("base64");
        console.log(
          "[FileService] Base64 conversion complete. Length:",
          base64PDF.length
        );

        const apiUrl = new URL("/api/parse-pdf", window.location.origin);
        console.log("[FileService] Making API request to:", apiUrl.toString());

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ base64PDF }),
        });

        console.log("[FileService] API Response status:", response.status);
        console.log(
          "[FileService] API Response status text:",
          response.statusText
        );

        // Try to get the response text first to debug any HTML responses
        const responseText = await response.text();
        console.log("[FileService] Raw response:", responseText.slice(0, 200));

        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status}, response: ${responseText.slice(0, 200)}`
          );
        }

        // Parse the response text as JSON
        const data = JSON.parse(responseText);
        console.log("[FileService] API Response data:", {
          hasText: !!data.text,
          textLength: data.text?.length,
          metadata: data.metadata,
        });

        if (data.error) throw new Error(data.error);

        return data.text;
      } catch (error) {
        console.error("[FileService] PDF parsing error:", error);
        throw new Error(
          "Failed to parse PDF file: " + (error as Error).message
        );
      }
    }

    // Default to text files
    return file.text();
  }
}
