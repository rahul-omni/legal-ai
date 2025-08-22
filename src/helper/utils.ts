import {SUPREME_COURT_CASE_TYPES_VALUE_MAPPING} from "@/lib/constants";

export function trimName(name: string): string {
  if (typeof name !== "string") return "";
  return name.length > 15 ? name.slice(0, 15) + "..." : name;
}


export function getCaseNumber(caseNumber: string, caseYear: string, caseType: string) {
  // Pad case number with leading zeros to make it 6 digits
  let paddedCaseNumber = caseNumber;
  if (caseNumber.length < 6) {
    paddedCaseNumber = caseNumber.padStart(6, '0');
  }

  const caseTypeValue = SUPREME_COURT_CASE_TYPES_VALUE_MAPPING[caseType as keyof typeof SUPREME_COURT_CASE_TYPES_VALUE_MAPPING];
  
  const caseNumber1 = `${caseTypeValue} No.-${paddedCaseNumber} - ${caseYear}`;//C.A. No.-010956 - 2018
  const caseNumber2 = `${caseTypeValue} No.-${paddedCaseNumber}-${paddedCaseNumber} - ${caseYear}`;//C.A. No.-010956-010956 - 2018
  return [caseNumber1, caseNumber2];
}
