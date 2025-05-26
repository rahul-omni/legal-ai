import * as pdfjsLib from 'pdfjs-dist';
import toast from 'react-hot-toast';

export const parsePDF = async (arrayBuffer: ArrayBuffer) => {
  try {
    // First validate it's a PDF by checking the header
    const header = new Uint8Array(arrayBuffer.slice(0, 4));
    if (String.fromCharCode(...header) !== '%PDF') {
      throw new Error('File does not appear to be a valid PDF (missing PDF header)');
    }

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: pdfjsLib.VerbosityLevel.ERRORS,
      disableAutoFetch: true,
      disableStream: true,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true
    }).promise;

    return pdf;
  } catch (error) {
    if (error && typeof error === 'object') {
      console.error('PDF parsing failed with details:', {
        errorName: (error as any).name,
        errorMessage: (error as any).message,
        stack: (error as any).stack
      });
    let message = 'Failed to parse PDF';
    const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : '';
    if (errorMessage.includes('Invalid PDF structure')) {
      message = 'The PDF file is corrupted or has an invalid structure';
    } else if (errorMessage.includes('password')) {
      message = 'The PDF is password protected';
    } else if (errorMessage.includes('PDF header')) {
      message = 'The file is not a valid PDF document';
    }

    toast.error(message);
    throw new Error(message);
    }

    toast.error(message);
    throw new Error(message);
  }
};