
export interface CaseData {
  id: string;
  serialNumber: string;
  diaryNumber: string;
  caseNumber: string;
  parties: string;
  advocates: string;
  bench: string;
  judgmentBy?: string;  // Made optional
  judgmentDate: string;
  judgmentText?: string;  // Made optional
  judgmentUrl: string;
  court: string;
  date?: string;  // Made optional
  createdAt?: string;  // Made optional
  updatedAt?: string;  // Made optional
  file_path?: string;
  caseType?: string;
  judgmentType?: string;
  city?: string;
  district?: string;
  courtComplex?: string;
  courtType?: string;
}

export interface SearchParams {
  number: string; // Required: Diary number
  year: string;   // Required: Year
  court: string;  // Optional: Empty string = "All Courts"
  judgmentType: string; // Optional: Empty string = "All Judgment Types" 
  caseType: string;     // Optional: Empty string = "All Case Types"
  city: string;  // Optional: Empty string = "All Cities"
  bench: string; // Optional: Empty string = "All Bench Types"
  district: string;
  courtComplex: string;
}

export interface ValidationErrors {
  number?: string;
  year?: string;
  court?: string;
  caseType?: string;
  city?: string;
  bench?: string;
  general?: string;
  district?: string;
  courtComplex?: string;
} 