import {SUPREME_COURT_CASE_TYPES_VALUE_MAPPING, DISTRICT_COURT_CASE_TYPES_1, DISTRICT_COURT_CASE_TYPES_2, DISTRICT_COURT_CASE_TYPES_3, EAST_DELHI_COURT_CASE_TYPES, CENTRAL_DELHI_ROUSE_AVENUE_COURT_CASE_TYPES, CENTRAL_DELHI_TIS_HAZARI_COURT_CASE_TYPES, NEW_DELHI_COURT_CASE_TYPES, NORTH_EAST_DISTRICT_COURT_CASE_TYPES, SHAHDARA_COURT_CASE_TYPES, SOUTH_EAST_DISTRICT_COURT_CASE_TYPES, SOUTH_DISTRICT_COURT_CASE_TYPES, NORTH_WEST_DISTRICT_COURT_CASE_TYPES, NORTH_DISTRICT_COURT_CASE_TYPES, DWARKA_COURT_SOUTH_WEST_DELHI_COURT_CASE_TYPES, WEST_DISTRICT_DELHI_COURT_COURT_COMPLEX, WEST_DISTRICT_DELHI_TIS_HAZARI_COURT_CASE_TYPES} from "@/lib/constants";

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
  
  // Check if the case type contains parentheses (like SLP(Crl))
  if (caseTypeValue.includes('(') && !caseTypeValue.includes('.)')) {
    // Generate both formats: with and without the dot
    const caseTypeWithDot = caseTypeValue.replace(')', '.)');
    
    // Generate 4 variations: both formats × both case number patterns
    const caseNumber1 = `${caseTypeValue} No.-${paddedCaseNumber} - ${caseYear}`; // SLP(Crl) No.-011741 - 2024
    const caseNumber2 = `${caseTypeValue} No.-${paddedCaseNumber}-${paddedCaseNumber} - ${caseYear}`; // SLP(Crl) No.-011741-011741 - 2024
    const caseNumber3 = `${caseTypeWithDot} No.-${paddedCaseNumber} - ${caseYear}`; // SLP(Crl.) No.-011741 - 2024
    const caseNumber4 = `${caseTypeWithDot} No.-${paddedCaseNumber}-${paddedCaseNumber} - ${caseYear}`; // SLP(Crl.) No.-011741-011741 - 2024
    
    return [caseNumber1, caseNumber2, caseNumber3, caseNumber4];
  } else {
    // For case types without parentheses, use the original logic
    const caseNumber1 = `${caseTypeValue} No.-${paddedCaseNumber} - ${caseYear}`; // C.A. No.-010956 - 2018
    const caseNumber2 = `${caseTypeValue} No.-${paddedCaseNumber}-${paddedCaseNumber} - ${caseYear}`; // C.A. No.-010956-010956 - 2018
    return [caseNumber1, caseNumber2];
  }
}


// New scalable structure for district court configurations
export const DISTRICT_COURT_CONFIGURATIONS = {
  "gurugram": {
    name: "Gurugram",
    courtComplexes: {
      "District Court, Gurugram": {
        caseTypes: DISTRICT_COURT_CASE_TYPES_1
      },
      "Judicial Complex, Sohna": {
        caseTypes: DISTRICT_COURT_CASE_TYPES_2
      },
      "Judicial Complex, Pataudi": {
        caseTypes: DISTRICT_COURT_CASE_TYPES_3
      }
    }
  },
   "East District Court, Delhi": {
    name: "East District Court, Delhi",
    courtComplexes: {
      "Karkardooma Court Complex": {
        caseTypes: EAST_DELHI_COURT_CASE_TYPES
      }
       
    }
  },
   "Central District Court, Delhi": {
    name: "Central District Court, Delhi",
    courtComplexes: {
      "Rouse Avenue Court Complex": {
        caseTypes: CENTRAL_DELHI_ROUSE_AVENUE_COURT_CASE_TYPES
      },
      "Tis Hazari Court Complex": {
        caseTypes: CENTRAL_DELHI_TIS_HAZARI_COURT_CASE_TYPES
      }
    }
  },
  "New Delhi District Court, Delhi": {
    name: "New Delhi District Court, Delhi",
    courtComplexes: {
      "Patiala House Court Complex": {
        caseTypes: NEW_DELHI_COURT_CASE_TYPES
      }
    }
  },
  "North East District Court, Delhi": {
    name: "North East District Court, Delhi",
    courtComplexes: {
      "Karkardooma Court Complex": {
        caseTypes: NORTH_EAST_DISTRICT_COURT_CASE_TYPES
      }
    }
  },
  "Shahdara District Court, Delhi": {
    name: "Shahdara District Court, Delhi",
    courtComplexes: {
      "Karkardooma Court Complex": {
        caseTypes: SHAHDARA_COURT_CASE_TYPES
      }
    }
  },
  "South East District Court, Delhi": {
    name: "South East District Court, Delhi",
    courtComplexes: {
      "Saket Court Complex": {
        caseTypes: SOUTH_EAST_DISTRICT_COURT_CASE_TYPES
      }
    }
  },
  "South District Court, Delhi": {
    name: "South District Court, Delhi",
    courtComplexes: {
      "Saket Court Complex": {
        caseTypes: SOUTH_DISTRICT_COURT_CASE_TYPES
      }
    }
  },
   "District Court North West Delhi": {
    name: "District Court North West Delhi",
    courtComplexes: {
      "Rohini Court Complex": {
        caseTypes: NORTH_WEST_DISTRICT_COURT_CASE_TYPES
      }
    }
  },
  "District Court North Delhi": {
    name:"District Court North Delhi",
    courtComplexes: {
      "Rohini Court Complex": {
        caseTypes: NORTH_DISTRICT_COURT_CASE_TYPES
      }
    }
  },
     "Dwarka Court South West Delhi": {
    name: "Dwarka Court South West Delhi",
    courtComplexes: {
      "Dwarka Court Complex": {
        caseTypes: DWARKA_COURT_SOUTH_WEST_DELHI_COURT_CASE_TYPES
      }
    }
  },
  "West District Court, Delhi" : {
    name: "West District Court, Delhi",
    courtComplexes: {
      "Tis Hazari Court Complex": {
        caseTypes: WEST_DISTRICT_DELHI_TIS_HAZARI_COURT_CASE_TYPES
      }
    }
  }
  // Future districts can be added here like:
  // "delhi": { ... },
  // "mumbai": { ... }
} as const;

// Helper function to get case types for a specific district and court complex
export function getDistrictCourtCaseTypes1(district: string, courtComplex: string) {
  const districtConfig = DISTRICT_COURT_CONFIGURATIONS[district as keyof typeof DISTRICT_COURT_CONFIGURATIONS];
  if (!districtConfig) return [];
  
  const complexConfig = districtConfig.courtComplexes[courtComplex as keyof typeof districtConfig.courtComplexes];
  // return complexConfig?.caseTypes || [];
}
export function getDistrictCourtCaseTypes(district: string, courtComplex: string) {
  const districtConfig = DISTRICT_COURT_CONFIGURATIONS[district as keyof typeof DISTRICT_COURT_CONFIGURATIONS];
  if (!districtConfig) return [];

  const complexConfig = districtConfig.courtComplexes[courtComplex as keyof (typeof districtConfig.courtComplexes)];
  return (complexConfig as { caseTypes: any[] } | undefined)?.caseTypes || [];
}

// Helper function to get available districts
export function getAvailableDistricts() {
  return Object.keys(DISTRICT_COURT_CONFIGURATIONS);
}

// Helper function to get court complexes for a specific district
export function getCourtComplexesForDistrict(district: string) {
  const districtConfig = DISTRICT_COURT_CONFIGURATIONS[district as keyof typeof DISTRICT_COURT_CONFIGURATIONS];
  return districtConfig ? Object.keys(districtConfig.courtComplexes) : [];
}