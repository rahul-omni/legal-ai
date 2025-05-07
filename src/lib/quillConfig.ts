// This file will be imported by QuillEditor to register fonts

// Function to register Quill fonts
export const registerQuillFonts = (Quill: any) => {
  // Add fonts to whitelist
  const Font = Quill.import('formats/font');
  Font.whitelist = [
    'arial',
    'times-new-roman',
    'georgia',
    'courier-new'
  ];
  Quill.register(Font, true);
}; 