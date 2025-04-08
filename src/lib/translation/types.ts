export type TranslationVendor = 'openai' | 'sarvam'

export type SarvamLanguageCode = 
  | 'en-IN' 
  | 'hi-IN' 
  | 'bn-IN' 
  | 'gu-IN' 
  | 'kn-IN' 
  | 'ml-IN' 
  | 'mr-IN' 
  | 'od-IN' 
  | 'pa-IN' 
  | 'ta-IN' 
  | 'te-IN'

export interface TranslationOptions {
  vendor: TranslationVendor;
  sourceText: string;
  targetLanguage: string;
  mode?: 'formal' | 'informal';
}

export const SARVAM_LANGUAGES = [
  { code: 'en-IN', name: 'English' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'gu-IN', name: 'Gujarati' },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'ml-IN', name: 'Malayalam' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'od-IN', name: 'Odia' },
  { code: 'pa-IN', name: 'Punjabi' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' }
] as const;

// Add OpenAI language options
export const OPENAI_LANGUAGES = [
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Gujarati', label: 'Gujarati' },
  { value: 'Kannada', label: 'Kannada' },
  { value: 'Malayalam', label: 'Malayalam' },
  { value: 'Marathi', label: 'Marathi' },
  { value: 'Odia', label: 'Odia' },
  { value: 'Punjabi', label: 'Punjabi' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'English', label: 'English' }
] as const; 