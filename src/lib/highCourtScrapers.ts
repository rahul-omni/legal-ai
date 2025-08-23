import {
  DELHI_COURT_CASE_TYPES_VALUE_MAPPING,
  APPELLATE_BOMBAY_COURT_CASE_TYPES_VALUE_MAPPING,
  NAGPUR_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  ORIGINAL_SIDE_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  GOA_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  SPECIAL_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  AURANGABAD_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  KOLHAPUR_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  ALLAHABAD_HIGH_COURT_ALLAHABAD_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  ALLAHABAD_HIGH_COURT_ALLAHABAD_HIGH_COURT_LUCKNOW_BENCH_CASE_TYPES_VALUE_MAPPING,
  CALCUTTA_HIGH_COURT_APPELLATE_SIDE_CASE_TYPES_VALUE_MAPPING,
  CALCUTTA_HIGH_COURT_CIRCUIT_BENCH_AT_JALPAIGURI_CASE_TYPES_VALUE_MAPPING,
  CALCUTTA_HIGH_COURT_CIRCUIT_BENCH_AT_PORT_BLAIR_CASE_TYPES_VALUE_MAPPING,
  CALCUTTA_HIGH_COURT_ORIGINAL_SIDE_CASE_TYPES_VALUE_MAPPING,
  GAUHATI_HIGH_COURT_AIZAWL_BENCH_CASE_TYPES_VALUE_MAPPING,
  GAUHATI_HIGH_COURT_PRINCIPAL_SEAT_AT_GUWAHATI_CASE_TYPES_VALUE_MAPPING,
  GAUHATI_HIGH_COURT_KOHIMA_BENCH_CASE_TYPES_VALUE_MAPPING,
  GAUHATI_HIGH_COURT_ITANAGAR_BENCH_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_FOR_STATE_OF_TELANGANA_PRINCIPAL_BENCH_AT_HYDERABAD_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_ANDHRA_PRADESH_PRINCIPAL_BENCH_AT_ANDHRA_PRADESH_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_CHHATTISGARH_PRINCIPAL_BENCH_CHHATTISGARH_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_GUJARAT_GUJARAT_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_JHARKHAND_PRINCIPAL_BENCH_JHARKHAND_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_KARNATAKA_BENCH_AT_DHARWAD_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_KARNATAKA_BENCH_AT_KALBURAGI_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_KARNATAKA_PRINCIPAL_BENCH_AT_BENGALURU_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_KERALA_HIGH_COURT_OF_KERALA_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_MANIPUR_HIGH_COURT_OF_MANIPUR_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_MEGHALAYA_HIGH_COURT_OF_MEGHALAYA_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_ORISSA_HIGH_COURT_OF_ORISSA_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_RAJASTHAN_HIGH_COURT_BENCH_AT_JAIPUR_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_RAJASTHAN_RAJASTHAN_HIGH_COURT_PRINCIPAL_SEAT_JODHPUR_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_SIKKIM_HIGH_COURT_OF_SIKKIM_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_TRIPURA_HIGH_COURT_OF_TRIPURA_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_UTTARAKHAND_HIGH_COURT_OF_UTTARAKHAND_CASE_TYPES_VALUE_MAPPING,
  PATNA_HIGH_COURT_PRINCIPAL_BENCH_PATNA_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_GWALIOR_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_INDORE_CASE_TYPES_VALUE_MAPPING,
  HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_JABALPUR_CASE_TYPES_VALUE_MAPPING
} from "@/lib/constants";

export type CaseTypeMapping = Record<string, number | null>;
// Issue Scrape
// Hyderabad, AndhraPradesh ,Kerala ,HimachalPradesh, Jammu Kashmir,
// Punjab &Haryana
export const HIGH_COURT_SCRAPERS: Record<string, {
  endpoint: string;
  defaultBench: string;
  benchMappings?: Record<string, CaseTypeMapping>;
  caseTypeMapping?: CaseTypeMapping;
  highCourtName: string;
  requiresBench?: boolean;
}> = {
     "Allahabad": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "Allahabad High Court",
    benchMappings: {
      "Allahabad High Court": ALLAHABAD_HIGH_COURT_ALLAHABAD_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
      "Allahabad High Court Lucknow Bench":  ALLAHABAD_HIGH_COURT_ALLAHABAD_HIGH_COURT_LUCKNOW_BENCH_CASE_TYPES_VALUE_MAPPING,

    },
    highCourtName: "Allahabad High Court",
    requiresBench: false
  },
  "Chhattisgarh": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "Principal Bench Chhattisgarh",
    benchMappings: {
      "Principal Bench Chhattisgarh": HIGH_COURT_OF_CHHATTISGARH_PRINCIPAL_BENCH_CHHATTISGARH_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court of Chhattisgarh",
    requiresBench: false
  },
  "Delhi": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "Principal Bench at Delhi",
    caseTypeMapping: DELHI_COURT_CASE_TYPES_VALUE_MAPPING,
    highCourtName: "High Court of Delhi",
    requiresBench: false
  },
  "Mumbai": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "Appellate Side,Bombay",
    benchMappings: {
      "Appellate Side,Bombay": APPELLATE_BOMBAY_COURT_CASE_TYPES_VALUE_MAPPING,
      "Bench at Aurangabad": AURANGABAD_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
      "Bench at Nagpur": NAGPUR_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
      "Bombay High Court,Bench at Kolhapur": KOLHAPUR_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
      "Original Side,Bombay": ORIGINAL_SIDE_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
      "High court of Bombay at Goa": GOA_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
      "Special Court (TORTS) Bombay": SPECIAL_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "Bombay High Court",
    requiresBench: false
  },
  "Calcutta": {
      endpoint: "fetchHighCourtJudgments",
      defaultBench: "Appellate side",
      benchMappings: {
        "Appellate side":CALCUTTA_HIGH_COURT_APPELLATE_SIDE_CASE_TYPES_VALUE_MAPPING,
          "Circuit Bench At Jalpaiguri":CALCUTTA_HIGH_COURT_CIRCUIT_BENCH_AT_JALPAIGURI_CASE_TYPES_VALUE_MAPPING,
          "Circuit Bench At Port Blair": CALCUTTA_HIGH_COURT_CIRCUIT_BENCH_AT_PORT_BLAIR_CASE_TYPES_VALUE_MAPPING,
          "Original Side": CALCUTTA_HIGH_COURT_ORIGINAL_SIDE_CASE_TYPES_VALUE_MAPPING,
        
      },
      highCourtName: "Calcutta High Court",
      requiresBench: false
    },
    "Guwahati": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "Aizawl Bench",
    benchMappings: {
     "Aizawl Bench":GAUHATI_HIGH_COURT_AIZAWL_BENCH_CASE_TYPES_VALUE_MAPPING,
      "Itanagar Bench":GAUHATI_HIGH_COURT_ITANAGAR_BENCH_CASE_TYPES_VALUE_MAPPING,
      "Kohima Bench": GAUHATI_HIGH_COURT_KOHIMA_BENCH_CASE_TYPES_VALUE_MAPPING,
     "Principal Seat at Guwahati":GAUHATI_HIGH_COURT_PRINCIPAL_SEAT_AT_GUWAHATI_CASE_TYPES_VALUE_MAPPING,
    },
    highCourtName: "Gauhati High Court",
    requiresBench: false
  },
  "Hyderabad": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "Principal Bench at Hyderabad",
    benchMappings: {
     "Principal Bench at Hyderabad":HIGH_COURT_FOR_STATE_OF_TELANGANA_PRINCIPAL_BENCH_AT_HYDERABAD_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court for State of Telangana",
    requiresBench: false
  },
     "Madhya Pradesh": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "High Court Of Madhya Pradesh Gwalior",
    benchMappings: {
     "High Court Of Madhya Pradesh Gwalior":HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_GWALIOR_CASE_TYPES_VALUE_MAPPING,
  "High Court Of Madhya Pradesh Indore":HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_INDORE_CASE_TYPES_VALUE_MAPPING,
  "High Court Of Madhya Pradesh Jabalpur":HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_JABALPUR_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court of Madhya Pradesh",
    requiresBench: false
  },
  "Jharkhand": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "Principal Bench Jharkhand",
    benchMappings: {
      "Principal Bench Jharkhand": HIGH_COURT_OF_JHARKHAND_PRINCIPAL_BENCH_JHARKHAND_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court of Jharkhand",
    requiresBench: false
  },
  // ... include remaining entries similarly ...
  "Gujarat": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "Gujarat High Court",
    benchMappings: {
      "Gujarat High Court": HIGH_COURT_OF_GUJARAT_GUJARAT_HIGH_COURT_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court of Gujarat",
    requiresBench: false
  },
  "Karnataka": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "Bench at Dharwad",
    benchMappings: {
      "Bench at Dharwad": HIGH_COURT_OF_KARNATAKA_BENCH_AT_DHARWAD_CASE_TYPES_VALUE_MAPPING,
      "Bench at Kalburagi": HIGH_COURT_OF_KARNATAKA_BENCH_AT_KALBURAGI_CASE_TYPES_VALUE_MAPPING,
      "Principal Bench at Bengaluru": HIGH_COURT_OF_KARNATAKA_PRINCIPAL_BENCH_AT_BENGALURU_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court of Karnataka",
    requiresBench: false
  },
  "Kerala": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench:  "High Court of Kerala",
    benchMappings: {
       "High Court of Kerala": HIGH_COURT_OF_KERALA_HIGH_COURT_OF_KERALA_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court of Kerala",
    requiresBench: false
  },
  "Manipur": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "High Court of Manipur",
    benchMappings: {
      "High Court of Manipur": HIGH_COURT_OF_MANIPUR_HIGH_COURT_OF_MANIPUR_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court of Manipur",
    requiresBench: false
  },
  "Meghalaya": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "High Court of Meghalaya",
    benchMappings: {
      "High Court of Meghalaya": HIGH_COURT_OF_MEGHALAYA_HIGH_COURT_OF_MEGHALAYA_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court of Meghalaya",
    requiresBench: false
  },
  "Orissa": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "High Court of Orissa",
    benchMappings: {
      "High Court of Orissa":  HIGH_COURT_OF_ORISSA_HIGH_COURT_OF_ORISSA_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court of Orissa",
    requiresBench: false
  },
   "Rajasthan": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench: "High Court of Rajasthan",
    benchMappings: {
     "High Court Bench at Jaipur":HIGH_COURT_OF_RAJASTHAN_HIGH_COURT_BENCH_AT_JAIPUR_CASE_TYPES_VALUE_MAPPING,
  "Rajasthan High Court Principal Seat Jodhpur":HIGH_COURT_OF_RAJASTHAN_RAJASTHAN_HIGH_COURT_PRINCIPAL_SEAT_JODHPUR_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court of Rajasthan",
    requiresBench: false
  },
  "Sikkim": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench:   "High Court of Sikkim",
    benchMappings: {
      "High Court of Sikkim":HIGH_COURT_OF_SIKKIM_HIGH_COURT_OF_SIKKIM_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court of Sikkim",
    requiresBench: false
  },
  "Tripura": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench:   "High Court of Tripura",
    benchMappings: {
      "High Court of Tripura": HIGH_COURT_OF_TRIPURA_HIGH_COURT_OF_TRIPURA_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court of Tripura",
    requiresBench: false
  },
  "Uttarakhand": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench:   "High Court of Uttarakhand",
    benchMappings: {
      "High Court of Uttarakhand": HIGH_COURT_OF_UTTARAKHAND_HIGH_COURT_OF_UTTARAKHAND_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "High Court of Uttarakhand",
    requiresBench: false
  },
  "Patna": {
    endpoint: "fetchHighCourtJudgments",
    defaultBench:    "Principal Bench Patna",
    benchMappings: {
       "Principal Bench Patna":  PATNA_HIGH_COURT_PRINCIPAL_BENCH_PATNA_CASE_TYPES_VALUE_MAPPING
    },
    highCourtName: "Patna High Court",
    requiresBench: false
  },
};

// helper: resolve numeric code from mapping by exact key or cleaned label
export function resolveCaseTypeValue(mapping: CaseTypeMapping | undefined, selectedLabel?: string): number | undefined {
  if (!mapping || !selectedLabel) return undefined;
  const label = selectedLabel.trim();
  if (Object.prototype.hasOwnProperty.call(mapping, label)) {
    const v = (mapping as any)[label];
    return v === null ? undefined : v;
  }
  for (const [k, v] of Object.entries(mapping)) {
    const m = k.match(/^(.*?)-(\d+)\s*$/);
    const clean = m ? m[1].trim() : k.trim();
    if (clean === label) {
      return typeof v === "number" ? v : (m ? Number(m[2]) : undefined);
    }
  }
  return undefined;
}

// function resolveCaseTypeValue(mapping: Record<string, number | null> | undefined, selectedLabel?: string): number | undefined {
//   if (!mapping || !selectedLabel) return undefined;
//   const label = selectedLabel.trim();
//   // exact key match first
//   if (Object.prototype.hasOwnProperty.call(mapping, label)) {
//     const v = (mapping as any)[label];
//     return v === null ? undefined : v;
//   }
//   // fallback: match cleaned label (strip trailing -digits)
//   for (const [k, v] of Object.entries(mapping)) {
//     const m = k.match(/^(.*?)-(\d+)\s*$/);
//     const clean = m ? m[1].trim() : k.trim();
//     if (clean === label) {
//       return typeof v === "number" ? v : (m ? Number(m[2]) : undefined);
//     }
//   }
//   return undefined;
// }