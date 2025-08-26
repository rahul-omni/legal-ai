import { Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
//import { HIGH_COURT_CASE_TYPES, HIGH_COURT_CITY, SUPREME_COURT_CASE_TYPES } from "@/lib/constants";
//import {  ALLAHABAD_HIGH_COURT_ALLAHABAD_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, ALLAHABAD_HIGH_COURT_ALLAHABAD_HIGH_COURT_LUCKNOW_BENCH_CASE_TYPES_VALUE_MAPPING, ALLAHABAD_HIGH_COURT_HIGH_COURT_BENCH, APPELLATE_BOMBAY_COURT_CASE_TYPES_VALUE_MAPPING,   AURANGABAD_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, BOMBAY_HIGH_COURT_BENCH, CALCUTTA_HIGH_COURT_APPELLATE_SIDE_CASE_TYPES_VALUE_MAPPING, CALCUTTA_HIGH_COURT_CIRCUIT_BENCH_AT_JALPAIGURI_CASE_TYPES_VALUE_MAPPING, CALCUTTA_HIGH_COURT_CIRCUIT_BENCH_AT_PORT_BLAIR_CASE_TYPES_VALUE_MAPPING, CALCUTTA_HIGH_COURT_HIGH_COURT_BENCH, CALCUTTA_HIGH_COURT_ORIGINAL_SIDE_CASE_TYPES_VALUE_MAPPING, DELHI_COURT_CASE_TYPES_VALUE_MAPPING, GAUHATI_HIGH_COURT_AIZAWL_BENCH_CASE_TYPES_VALUE_MAPPING, GAUHATI_HIGH_COURT_HIGH_COURT_BENCH, GAUHATI_HIGH_COURT_ITANAGAR_BENCH_CASE_TYPES_VALUE_MAPPING, GAUHATI_HIGH_COURT_KOHIMA_BENCH_CASE_TYPES_VALUE_MAPPING, GAUHATI_HIGH_COURT_PRINCIPAL_SEAT_AT_GUWAHATI_CASE_TYPES_VALUE_MAPPING, GOA_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_CITY,  HIGH_COURT_FOR_STATE_OF_TELANGANA_HIGH_COURT_BENCH,  HIGH_COURT_FOR_STATE_OF_TELANGANA_PRINCIPAL_BENCH_AT_HYDERABAD_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_ANDHRA_PRADESH_HIGH_COURT_BENCH,  HIGH_COURT_OF_ANDHRA_PRADESH_PRINCIPAL_BENCH_AT_ANDHRA_PRADESH_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_CHHATTISGARH_HIGH_COURT_BENCH,  HIGH_COURT_OF_CHHATTISGARH_PRINCIPAL_BENCH_CHHATTISGARH_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_GUJARAT_GUJARAT_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_GUJARAT_HIGH_COURT_BENCH,  HIGH_COURT_OF_HIMACHAL_PRADESH_HIGH_COURT_BENCH,  HIGH_COURT_OF_HIMACHAL_PRADESH_HIGH_COURT_OF_HIMACHAL_PRADESH_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_JAMMU_AND_KASHMIR_HIGH_COURT_BENCH,  HIGH_COURT_OF_JAMMU_AND_KASHMIR_JAMMU_WING_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_JAMMU_AND_KASHMIR_SRINAGAR_WING_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_JHARKHAND_HIGH_COURT_BENCH,  HIGH_COURT_OF_JHARKHAND_PRINCIPAL_BENCH_JHARKHAND_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_KARNATAKA_BENCH_AT_DHARWAD_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_KARNATAKA_BENCH_AT_KALBURAGI_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_KARNATAKA_HIGH_COURT_BENCH,  HIGH_COURT_OF_KARNATAKA_PRINCIPAL_BENCH_AT_BENGALURU_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_KERALA_HIGH_COURT_BENCH,  HIGH_COURT_OF_KERALA_HIGH_COURT_OF_KERALA_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_BENCH,  HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_GWALIOR_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_INDORE_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_JABALPUR_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_MANIPUR_HIGH_COURT_BENCH,  HIGH_COURT_OF_MANIPUR_HIGH_COURT_OF_MANIPUR_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_MEGHALAYA_HIGH_COURT_BENCH,  HIGH_COURT_OF_MEGHALAYA_HIGH_COURT_OF_MEGHALAYA_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_ORISSA_HIGH_COURT_BENCH,  HIGH_COURT_OF_ORISSA_HIGH_COURT_OF_ORISSA_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_PUNJAB_AND_HARYANA_HIGH_COURT_BENCH,  HIGH_COURT_OF_PUNJAB_AND_HARYANA_HIGH_COURT_OF_PUNJAB_AND_HARYANA_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_RAJASTHAN_HIGH_COURT_BENCH,  HIGH_COURT_OF_RAJASTHAN_HIGH_COURT_BENCH_AT_JAIPUR_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_RAJASTHAN_RAJASTHAN_HIGH_COURT_PRINCIPAL_SEAT_JODHPUR_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_SIKKIM_HIGH_COURT_BENCH,  HIGH_COURT_OF_SIKKIM_HIGH_COURT_OF_SIKKIM_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_TRIPURA_HIGH_COURT_BENCH,  HIGH_COURT_OF_TRIPURA_HIGH_COURT_OF_TRIPURA_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_UTTARAKHAND_HIGH_COURT_BENCH,  HIGH_COURT_OF_UTTARAKHAND_HIGH_COURT_OF_UTTARAKHAND_CASE_TYPES_VALUE_MAPPING,  KOLHAPUR_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,   MADRAS_HIGH_COURT_HIGH_COURT_BENCH,   MADRAS_HIGH_COURT_MADURAI_BENCH_OF_MADRAS_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,   MADRAS_HIGH_COURT_PRINCIPAL_BENCH_OF_MADRAS_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,   NAGPUR_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,  ORIGINAL_SIDE_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,  PATNA_HIGH_COURT_HIGH_COURT_BENCH,  PATNA_HIGH_COURT_PRINCIPAL_BENCH_PATNA_CASE_TYPES_VALUE_MAPPING,  SPECIAL_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, SUPREME_COURT_CASE_TYPES } from "@/lib/constants";
 
import {  ALLAHABAD_HIGH_COURT_ALLAHABAD_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, ALLAHABAD_HIGH_COURT_ALLAHABAD_HIGH_COURT_LUCKNOW_BENCH_CASE_TYPES_VALUE_MAPPING, ALLAHABAD_HIGH_COURT_HIGH_COURT_BENCH, APPELLATE_BOMBAY_COURT_CASE_TYPES_VALUE_MAPPING,   AURANGABAD_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, BOMBAY_HIGH_COURT_BENCH, CALCUTTA_HIGH_COURT_APPELLATE_SIDE_CASE_TYPES_VALUE_MAPPING, CALCUTTA_HIGH_COURT_CIRCUIT_BENCH_AT_JALPAIGURI_CASE_TYPES_VALUE_MAPPING, CALCUTTA_HIGH_COURT_CIRCUIT_BENCH_AT_PORT_BLAIR_CASE_TYPES_VALUE_MAPPING, CALCUTTA_HIGH_COURT_HIGH_COURT_BENCH, CALCUTTA_HIGH_COURT_ORIGINAL_SIDE_CASE_TYPES_VALUE_MAPPING, DELHI_COURT_CASE_TYPES_VALUE_MAPPING, GAUHATI_HIGH_COURT_AIZAWL_BENCH_CASE_TYPES_VALUE_MAPPING, GAUHATI_HIGH_COURT_HIGH_COURT_BENCH, GAUHATI_HIGH_COURT_ITANAGAR_BENCH_CASE_TYPES_VALUE_MAPPING, GAUHATI_HIGH_COURT_KOHIMA_BENCH_CASE_TYPES_VALUE_MAPPING, GAUHATI_HIGH_COURT_PRINCIPAL_SEAT_AT_GUWAHATI_CASE_TYPES_VALUE_MAPPING, GOA_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_CITY,  HIGH_COURT_FOR_STATE_OF_TELANGANA_HIGH_COURT_BENCH,  HIGH_COURT_FOR_STATE_OF_TELANGANA_PRINCIPAL_BENCH_AT_HYDERABAD_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_ANDHRA_PRADESH_HIGH_COURT_BENCH,  HIGH_COURT_OF_ANDHRA_PRADESH_PRINCIPAL_BENCH_AT_ANDHRA_PRADESH_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_CHHATTISGARH_HIGH_COURT_BENCH,  HIGH_COURT_OF_CHHATTISGARH_PRINCIPAL_BENCH_CHHATTISGARH_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_DELHI_HIGH_COURT_BENCH,  HIGH_COURT_OF_GUJARAT_GUJARAT_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_GUJARAT_HIGH_COURT_BENCH,  HIGH_COURT_OF_HIMACHAL_PRADESH_HIGH_COURT_BENCH,  HIGH_COURT_OF_HIMACHAL_PRADESH_HIGH_COURT_OF_HIMACHAL_PRADESH_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_JAMMU_AND_KASHMIR_HIGH_COURT_BENCH,  HIGH_COURT_OF_JAMMU_AND_KASHMIR_JAMMU_WING_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_JAMMU_AND_KASHMIR_SRINAGAR_WING_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_JHARKHAND_HIGH_COURT_BENCH,  HIGH_COURT_OF_JHARKHAND_PRINCIPAL_BENCH_JHARKHAND_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_KARNATAKA_BENCH_AT_DHARWAD_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_KARNATAKA_BENCH_AT_KALBURAGI_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_KARNATAKA_HIGH_COURT_BENCH,  HIGH_COURT_OF_KARNATAKA_PRINCIPAL_BENCH_AT_BENGALURU_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_KERALA_HIGH_COURT_BENCH,  HIGH_COURT_OF_KERALA_HIGH_COURT_OF_KERALA_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_BENCH,  HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_GWALIOR_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_INDORE_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_JABALPUR_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_MANIPUR_HIGH_COURT_BENCH,  HIGH_COURT_OF_MANIPUR_HIGH_COURT_OF_MANIPUR_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_MEGHALAYA_HIGH_COURT_BENCH,  HIGH_COURT_OF_MEGHALAYA_HIGH_COURT_OF_MEGHALAYA_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_ORISSA_HIGH_COURT_BENCH,  HIGH_COURT_OF_ORISSA_HIGH_COURT_OF_ORISSA_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_PUNJAB_AND_HARYANA_HIGH_COURT_BENCH,  HIGH_COURT_OF_PUNJAB_AND_HARYANA_HIGH_COURT_OF_PUNJAB_AND_HARYANA_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_RAJASTHAN_HIGH_COURT_BENCH,  HIGH_COURT_OF_RAJASTHAN_HIGH_COURT_BENCH_AT_JAIPUR_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_RAJASTHAN_RAJASTHAN_HIGH_COURT_PRINCIPAL_SEAT_JODHPUR_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_SIKKIM_HIGH_COURT_BENCH,  HIGH_COURT_OF_SIKKIM_HIGH_COURT_OF_SIKKIM_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_TRIPURA_HIGH_COURT_BENCH,  HIGH_COURT_OF_TRIPURA_HIGH_COURT_OF_TRIPURA_CASE_TYPES_VALUE_MAPPING,  HIGH_COURT_OF_UTTARAKHAND_HIGH_COURT_BENCH,  HIGH_COURT_OF_UTTARAKHAND_HIGH_COURT_OF_UTTARAKHAND_CASE_TYPES_VALUE_MAPPING,  KOLHAPUR_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,   MADRAS_HIGH_COURT_HIGH_COURT_BENCH,   MADRAS_HIGH_COURT_MADURAI_BENCH_OF_MADRAS_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,   MADRAS_HIGH_COURT_PRINCIPAL_BENCH_OF_MADRAS_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,   NAGPUR_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,  ORIGINAL_SIDE_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,  PATNA_HIGH_COURT_HIGH_COURT_BENCH,  PATNA_HIGH_COURT_PRINCIPAL_BENCH_PATNA_CASE_TYPES_VALUE_MAPPING,  SPECIAL_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING, SUPREME_COURT_CASE_TYPES } from "@/lib/constants";
import { SearchParams, ValidationErrors } from "./types";
import { getAvailableDistricts, getCourtComplexesForDistrict, getDistrictCourtCaseTypes } from "@/helper/utils";

interface SearchFormProps {
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  isLoading: boolean;
  onSearch: () => void;
  errors?: ValidationErrors;
}

export function SearchForm({ searchParams, setSearchParams, isLoading, onSearch, errors }: SearchFormProps) {
  const loadingMessages = useMemo(
    () => [
      "Validating inputs...",
      "Contacting court services...",
      "Fetching case records...",
      "Parsing judgments...",
      "Almost there...",
    ],
    []
  );
  const [messageIndex, setMessageIndex] = useState(0);
   
  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0);
      return;
    }
    const intervalId = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, [isLoading, loadingMessages.length]);
   
  
 console.log("Search Params:", searchParams);

 
// allow null values from the imported mappings
const BENCH_CASE_TYPE_MAP: Record<string, Record<string, number | null>> = {
  // Bombay benches
  "Appellate Side,Bombay": APPELLATE_BOMBAY_COURT_CASE_TYPES_VALUE_MAPPING,
  "Bench at Aurangabad": AURANGABAD_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  "Bench at Nagpur": NAGPUR_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  "Bombay High Court,Bench at Kolhapur": KOLHAPUR_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  "High court of Bombay at Goa": GOA_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  "Special Court (TORTS) Bombay": SPECIAL_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  "Original Side,Bombay": ORIGINAL_SIDE_BOMBAY_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,

  // Allahabad benches
  "Allahabad High Court": ALLAHABAD_HIGH_COURT_ALLAHABAD_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  "Allahabad High Court Lucknow Bench": ALLAHABAD_HIGH_COURT_ALLAHABAD_HIGH_COURT_LUCKNOW_BENCH_CASE_TYPES_VALUE_MAPPING,
  // add other bench -> mapping entries here as needed

  "Appellate side":CALCUTTA_HIGH_COURT_APPELLATE_SIDE_CASE_TYPES_VALUE_MAPPING,
  "Circuit Bench At Jalpaiguri":CALCUTTA_HIGH_COURT_CIRCUIT_BENCH_AT_JALPAIGURI_CASE_TYPES_VALUE_MAPPING,
  "Circuit Bench At Port Blair": CALCUTTA_HIGH_COURT_CIRCUIT_BENCH_AT_PORT_BLAIR_CASE_TYPES_VALUE_MAPPING,
  "Original Side": CALCUTTA_HIGH_COURT_ORIGINAL_SIDE_CASE_TYPES_VALUE_MAPPING,

   "Aizawl Bench":GAUHATI_HIGH_COURT_AIZAWL_BENCH_CASE_TYPES_VALUE_MAPPING,
  "Itanagar Bench": GAUHATI_HIGH_COURT_ITANAGAR_BENCH_CASE_TYPES_VALUE_MAPPING,
  "Kohima Bench": GAUHATI_HIGH_COURT_KOHIMA_BENCH_CASE_TYPES_VALUE_MAPPING,
  "Principal Seat at Guwahati": GAUHATI_HIGH_COURT_PRINCIPAL_SEAT_AT_GUWAHATI_CASE_TYPES_VALUE_MAPPING,

   "Principal Bench at Hyderabad":HIGH_COURT_FOR_STATE_OF_TELANGANA_PRINCIPAL_BENCH_AT_HYDERABAD_CASE_TYPES_VALUE_MAPPING,
   "Principal Bench at Andhra Pradesh":HIGH_COURT_OF_ANDHRA_PRADESH_PRINCIPAL_BENCH_AT_ANDHRA_PRADESH_CASE_TYPES_VALUE_MAPPING,
   "Principal Bench Chhattisgarh":HIGH_COURT_OF_CHHATTISGARH_PRINCIPAL_BENCH_CHHATTISGARH_CASE_TYPES_VALUE_MAPPING,
   "Gujarat High Court":HIGH_COURT_OF_GUJARAT_GUJARAT_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
   "High Court of Himachal Pradesh":HIGH_COURT_OF_HIMACHAL_PRADESH_HIGH_COURT_OF_HIMACHAL_PRADESH_CASE_TYPES_VALUE_MAPPING,
   "Jammu Wing":HIGH_COURT_OF_JAMMU_AND_KASHMIR_JAMMU_WING_CASE_TYPES_VALUE_MAPPING,
  "Srinagar Wing":HIGH_COURT_OF_JAMMU_AND_KASHMIR_SRINAGAR_WING_CASE_TYPES_VALUE_MAPPING,
  "Principal Bench Jharkhand":HIGH_COURT_OF_JHARKHAND_PRINCIPAL_BENCH_JHARKHAND_CASE_TYPES_VALUE_MAPPING,
  "Bench at Dharwad":HIGH_COURT_OF_KARNATAKA_BENCH_AT_DHARWAD_CASE_TYPES_VALUE_MAPPING,
  "Bench at Kalburagi":HIGH_COURT_OF_KARNATAKA_BENCH_AT_KALBURAGI_CASE_TYPES_VALUE_MAPPING,
  "Principal Bench at Bengaluru":HIGH_COURT_OF_KARNATAKA_PRINCIPAL_BENCH_AT_BENGALURU_CASE_TYPES_VALUE_MAPPING,
  "High Court of Kerala":HIGH_COURT_OF_KERALA_HIGH_COURT_OF_KERALA_CASE_TYPES_VALUE_MAPPING,
  "High Court Of Madhya Pradesh Gwalior":HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_GWALIOR_CASE_TYPES_VALUE_MAPPING,
  "High Court Of Madhya Pradesh Indore":HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_INDORE_CASE_TYPES_VALUE_MAPPING,
  "High Court Of Madhya Pradesh Jabalpur":HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_OF_MADHYA_PRADESH_JABALPUR_CASE_TYPES_VALUE_MAPPING,
  "High Court of Manipur":HIGH_COURT_OF_MANIPUR_HIGH_COURT_OF_MANIPUR_CASE_TYPES_VALUE_MAPPING,
  "High Court of Meghalaya":HIGH_COURT_OF_MEGHALAYA_HIGH_COURT_OF_MEGHALAYA_CASE_TYPES_VALUE_MAPPING,
   "High Court of Orissa":HIGH_COURT_OF_ORISSA_HIGH_COURT_OF_ORISSA_CASE_TYPES_VALUE_MAPPING,
   "High Court of Punjab and Haryana":HIGH_COURT_OF_PUNJAB_AND_HARYANA_HIGH_COURT_OF_PUNJAB_AND_HARYANA_CASE_TYPES_VALUE_MAPPING,
    "High Court Bench at Jaipur":HIGH_COURT_OF_RAJASTHAN_HIGH_COURT_BENCH_AT_JAIPUR_CASE_TYPES_VALUE_MAPPING,
     "Rajasthan High Court Principal Seat Jodhpur": HIGH_COURT_OF_RAJASTHAN_RAJASTHAN_HIGH_COURT_PRINCIPAL_SEAT_JODHPUR_CASE_TYPES_VALUE_MAPPING ,
     "High Court of Sikkim":HIGH_COURT_OF_SIKKIM_HIGH_COURT_OF_SIKKIM_CASE_TYPES_VALUE_MAPPING,
     "High Court of Tripura":HIGH_COURT_OF_TRIPURA_HIGH_COURT_OF_TRIPURA_CASE_TYPES_VALUE_MAPPING,
     "High Court of Uttarakhand":HIGH_COURT_OF_UTTARAKHAND_HIGH_COURT_OF_UTTARAKHAND_CASE_TYPES_VALUE_MAPPING,
     "Madurai Bench of Madras High Court":MADRAS_HIGH_COURT_MADURAI_BENCH_OF_MADRAS_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  "Principal Bench of Madras High Court":MADRAS_HIGH_COURT_PRINCIPAL_BENCH_OF_MADRAS_HIGH_COURT_CASE_TYPES_VALUE_MAPPING,
  "Principal Bench Patna":PATNA_HIGH_COURT_PRINCIPAL_BENCH_PATNA_CASE_TYPES_VALUE_MAPPING


};
// ...existing code...

 

const benchOptions = useMemo(() => {
  switch ((searchParams.city || "").trim()) {
    case "Mumbai":
      return BOMBAY_HIGH_COURT_BENCH;
    case "Allahabad":
      return ALLAHABAD_HIGH_COURT_HIGH_COURT_BENCH;
    case "Delhi":
      return HIGH_COURT_OF_DELHI_HIGH_COURT_BENCH;
    case "Calcutta":
      return  CALCUTTA_HIGH_COURT_HIGH_COURT_BENCH;
    case "Guwahati":
      return GAUHATI_HIGH_COURT_HIGH_COURT_BENCH;
    case "Hyderabad":
      return  HIGH_COURT_FOR_STATE_OF_TELANGANA_HIGH_COURT_BENCH;
    case "Andhra Pradesh":
      return  HIGH_COURT_OF_ANDHRA_PRADESH_HIGH_COURT_BENCH;
    case "Chhattisgarh":
      return HIGH_COURT_OF_CHHATTISGARH_HIGH_COURT_BENCH;
    case "Gujarat":
      return HIGH_COURT_OF_GUJARAT_HIGH_COURT_BENCH;
    case "Himachal Pradesh":
      return HIGH_COURT_OF_HIMACHAL_PRADESH_HIGH_COURT_BENCH;
    case "Jammu Kashmir":
      return HIGH_COURT_OF_JAMMU_AND_KASHMIR_HIGH_COURT_BENCH;
    case "Jharkhand":
      return HIGH_COURT_OF_JHARKHAND_HIGH_COURT_BENCH;
    case "Karnataka":
      return HIGH_COURT_OF_KARNATAKA_HIGH_COURT_BENCH;
    case "Kerala":
      return HIGH_COURT_OF_KERALA_HIGH_COURT_BENCH;
    case "Madhya Pradesh":
      return HIGH_COURT_OF_MADHYA_PRADESH_HIGH_COURT_BENCH;
    case "Manipur":
      return HIGH_COURT_OF_MANIPUR_HIGH_COURT_BENCH;
    case "Meghalaya":
      return  HIGH_COURT_OF_MEGHALAYA_HIGH_COURT_BENCH;
    case "Orissa":
      return HIGH_COURT_OF_ORISSA_HIGH_COURT_BENCH;
    case "Punjab and Haryana":
      return HIGH_COURT_OF_PUNJAB_AND_HARYANA_HIGH_COURT_BENCH;
    case "Rajasthan":
      return  HIGH_COURT_OF_RAJASTHAN_HIGH_COURT_BENCH;
    case "Sikkim":
      return  HIGH_COURT_OF_SIKKIM_HIGH_COURT_BENCH;
    case "Tripura":
      return  HIGH_COURT_OF_TRIPURA_HIGH_COURT_BENCH;
    case "Uttarakhand":
      return  HIGH_COURT_OF_UTTARAKHAND_HIGH_COURT_BENCH;
    case "Madras":
      return  MADRAS_HIGH_COURT_HIGH_COURT_BENCH;
    case "Patna":
      return PATNA_HIGH_COURT_HIGH_COURT_BENCH;
    default:
      return [];
  }
}, [searchParams.city]);

  
// derive case type options from selected bench / city (label + code)
const caseTypeOptions = useMemo(() => {
  const bench = (searchParams.bench || "").trim();
  // helper to clean key like "A227(...)-90" -> label "A227(...)" and code 90
  const buildOptionsFromMapping = (mapping?: Record<string, number | null>) => {
    if (!mapping) return [] as { label: string; code?: number }[];
    return Object.entries(mapping).map(([k, v]) => {
      // extract trailing -digits if present
      const m = k.match(/^(.*?)-(\d+)\s*$/);
      const label = m ? m[1] : k;
      const code = typeof v === "number" ? v : m ? Number(m[2]) : undefined;
      return { label, code };
    });
  };

  if (bench && BENCH_CASE_TYPE_MAP[bench]) {
    return buildOptionsFromMapping(BENCH_CASE_TYPE_MAP[bench]);
  }

  // per-city fallback: example for Delhi
  if ((searchParams.city || "").trim() === "Delhi") {
    return buildOptionsFromMapping(DELHI_COURT_CASE_TYPES_VALUE_MAPPING as any);
  }

  return [] as { label: string; code?: number }[];
}, [searchParams.city, searchParams.bench]);

 
 
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Form Header */}
      <div className="text-center pb-2">
        <h4 className="text-xl font-semibold text-text mb-2">Search Legal Cases</h4>
        <p className="text-sm text-text-light">
          Enter case details to search for available judgments
        </p>
      </div>

      {/* General Error */}
      {errors?.general && (
        <div className="bg-error-light border border-error rounded-md p-3">
          <p className="text-sm text-error">{errors.general}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Court Selection */}
        <div>
          <label className="block text-sm font-medium text-text-light mb-2">
            Court Type <span className="text-error">*</span>
          </label>
          <select
            value={searchParams.court}
            onChange={(e) =>
              setSearchParams({ 
                ...searchParams, 
                court: e.target.value, 
                caseType: "", 
                year: "", 
                city: "", 
                bench: "",
                judgmentType: "", 
                number: "" 
              })
            }
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light ${
              errors?.court ? 'border-error' : 'border-border'
            }`}
          >
            <option value="">Select court type</option>
            <option value="Supreme Court">Supreme Court</option>
            <option value="High Court">High Court</option>
            <option value="District Court">District Court</option>
          </select>
          {errors?.court && (
            <p className="mt-1 text-sm text-error">{errors.court}</p>
          )}
        </div>

        {/* City Selection (only for High Court) */}
        {searchParams.court === "High Court" && (
          <div>
            <label className="block text-sm font-medium text-text-light mb-2">
              City <span className="text-error">*</span>
            </label>
            <select
              value={searchParams.city}
              onChange={(e) =>
                setSearchParams({ 
                  ...searchParams, 
                  city: e.target.value, 
                  bench: "",
                  caseType: "" 
                })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light ${
                errors?.city ? 'border-error' : 'border-border'
              }`}
            >
              <option value="">Select City</option>
              {HIGH_COURT_CITY.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {errors?.city && (
              <p className="mt-1 text-sm text-error">{errors.city}</p>
            )}
          </div>
        )}

        {/* District Selection (only for District Court) */}
        {searchParams.court === "District Court" && (
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-light mb-2">
              District <span className="text-error">*</span>
            </label>
            <select
              value={searchParams.district}
              onChange={(e) =>
                setSearchParams({ 
                  ...searchParams, 
                  district: e.target.value,
                  courtComplex: "",
                  caseType: ""
                })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light ${
                errors?.district ? 'border-error' : 'border-border'
              }`}
            >
              <option value="">Select District</option>
              {getAvailableDistricts().map(district => (
                <option key={district} value={district}>
                  {district.charAt(0).toUpperCase() + district.slice(1)}
                </option>
              ))}
            </select>
            {errors?.district && (
              <p className="mt-1 text-sm text-error">{errors.district}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-light mb-2">
              Court Complex <span className="text-error">*</span>
            </label>
            <select
              value={searchParams.courtComplex}
              onChange={(e) =>
                setSearchParams({ 
                  ...searchParams, 
                  courtComplex: e.target.value,
                  caseType: ""
                })
              }
              disabled={!searchParams.district}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light ${
                errors?.courtComplex ? 'border-error' : 'border-border'
              } ${!searchParams.district ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">Select Court Complex</option>
              {searchParams.district && getCourtComplexesForDistrict(searchParams.district).map(complex => (
                <option key={complex} value={complex}>{complex}</option>
              ))}
            </select>
            {errors?.courtComplex && (
              <p className="mt-1 text-sm text-error">{errors.courtComplex}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-light mb-2">
              Case Type <span className="text-error">*</span>
            </label>
            <select
              value={searchParams.caseType}
              onChange={(e) =>
                setSearchParams({ ...searchParams, caseType: e.target.value })
              }
              disabled={!searchParams.courtComplex}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light ${
                errors?.caseType ? 'border-error' : 'border-border'
              } ${!searchParams.courtComplex ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">Select Case Type</option>
              {searchParams.district && searchParams.courtComplex && 
                getDistrictCourtCaseTypes(searchParams.district, searchParams.courtComplex).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))
              }
            </select>
            {errors?.caseType && (
              <p className="mt-1 text-sm text-error">{errors.caseType}</p>
            )}
            </div>
          </div>
        )}

        {/* Bench Selection (only for Mumbai High Court) */}
        {searchParams.court === "High Court" && searchParams.city && benchOptions.length>0 &&  (
          <div>
            <label className="block text-sm font-medium text-text-light mb-2">
              Bench <span className="text-error">*</span>
            </label>
            <select
              value={searchParams.bench}
              onChange={(e) =>
                setSearchParams({ 
                  ...searchParams, 
                  bench: e.target.value,
                  caseType: ""
                })
              }
                
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light ${
                errors?.bench ? 'border-error' : 'border-border'
              }`}
            >
              <option value="">Select Bench</option>
              
               {benchOptions.map(bench => (
                <option key={bench} value={bench}>{bench}</option>
              ))}
            </select>
            {errors?.bench && (
              <p className="mt-1 text-sm text-error">{errors.bench}</p>
            )}
          </div>
        )}

        

       
        {/* Case Type for High Court (with bench-specific options for Mumbai) */}
       

        {searchParams.court === "High Court" && (
  <div>
    <label className="block text-sm font-medium text-text-light mb-2">
      Case Type <span className="text-error">*</span>
    </label>
    <select
      value={searchParams.caseType}
      onChange={(e) =>
        setSearchParams({ ...searchParams, caseType: e.target.value })
      }
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light ${
        errors?.caseType ? 'border-error' : 'border-border'
      }`}
    >
      <option value="">Select Case Type</option>
      {caseTypeOptions.length > 0 ? (
        caseTypeOptions.map(opt => (
          <option key={opt.label} value={opt.label}>{opt.label}</option>
        ))
      ) : (
        <option value="">No case types available for selected bench/city</option>
      )}
    </select>
    {errors?.caseType && (
      <p className="mt-1 text-sm text-error">{errors.caseType}</p>
    )}
  </div>
)}

        {searchParams.court === "Supreme Court" && (
          <div>
            <label className="block text-sm font-medium text-text-light mb-2">
              Case Type <span className="text-error">*</span>
            </label>
            <select
              value={searchParams.caseType}
              onChange={(e) =>
                setSearchParams({ ...searchParams, caseType: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light ${errors?.caseType ? 'border-error' : 'border-border'
              }`}
            >
              <option value="">Select Case Type</option>
              {SUPREME_COURT_CASE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors?.caseType && (
              <p className="mt-1 text-sm text-error">{errors.caseType}</p>
            )}
          </div>
        )}
      

        {/* Case Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-light mb-2">
              Case Number <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={searchParams.number}
              onChange={(e) =>
                setSearchParams({ ...searchParams, number: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors?.number ? 'border-error' : 'border-border'
                }`}
              placeholder="e.g. 72381"
            />
            {errors?.number && (
              <p className="mt-1 text-sm text-error">{errors.number}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-light mb-2">
              Year <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={searchParams.year}
              onChange={(e) =>
                setSearchParams({ ...searchParams, year: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                errors?.year ? 'border-error' : 'border-border'
              }`}
              placeholder="e.g. 1989"
            />
            {errors?.year && (
              <p className="mt-1 text-sm text-error">{errors.year}</p>
            )}
          </div>
        </div>

        {/* High Court City Options */}
        {searchParams.court === 'High Court' && (
          <div>
            <label htmlFor="judgmentType" className="block text-sm font-medium text-text mb-1">
              Judgement Type
            </label>
            <select
              id="judgmentType"
              name="judgmentType"
              value={searchParams.judgmentType}
              onChange={(e) =>
                setSearchParams({ ...searchParams, judgmentType: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary"
            >
              <option value="">All Types</option>
              <option value="JUDGEMENT">Judgement</option>
              <option value="ORDER">Order</option>
              <option value="Interim Order">Interim Order</option>
              <option value="Registrar Order">Registrar Order</option>
              <option value="Farad Order">Farad Order</option>
            </select>
          </div>
        )}

        {/* Search Button */}
        <div className="pt-4">
          <button
            onClick={onSearch}
            className="w-full px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {loadingMessages[messageIndex]}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search Cases
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}