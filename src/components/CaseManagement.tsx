import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { CaseData, SearchParams, ValidationErrors } from "./caseManagementComponents/types";
import { CaseList } from "./caseManagementComponents/CaseList";
import { SearchModal } from "./caseManagementComponents/SearchModal";
import Header from "./ui/Header";
import Button from "./ui/Button";
import { uniq } from "lodash";

export function CaseManagement() {
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundCases, setFoundCases] = useState<CaseData[]>([]);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCases, setSelectedCases] = useState<CaseData[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const defaultSearchParams:SearchParams = {
    number: "",
    year: "",
    court: "",
    judgmentType: "",
    caseType: "",
    city: "",
    bench:"",
    district: "",
    courtComplex: ""
  }

  const [searchParams, setSearchParams] = useState<SearchParams>(defaultSearchParams);

  const [newlyCreatedCase, setNewlyCreatedCase] = useState<CaseData | null>(null);
  const [expandedCases, setExpandedCases] = useState<Record<string, boolean>>({});
  const [caseDetails, setCaseDetails] = useState<Record<string, CaseData[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});
     
   function normalizeCaseData(rawCase: any, index: number): CaseData {
  // Handle both snake_case and camelCase property names
  const getValue = (keys: string[], defaultValue = '') => {
    for (const key of keys) {
      if (rawCase[key] !== undefined) return rawCase[key];
    }
    return defaultValue;
  };

  return {
    id: rawCase.id || `${getValue(['diaryNumber', 'Diary Number'], 'case')}-${index}`,
    serialNumber: getValue(['serialNumber', 'Serial Number']),
    diaryNumber: getValue(['diaryNumber', 'Diary Number']),
    caseNumber: getValue(['caseNumber', 'Case Number']),
    court: getValue(['court', 'Court'], 'High Court'),
    bench: getValue(['bench', 'Bench']),
    judgmentBy: getValue(['judgmentBy', 'Judgment By']),
    judgmentDate: getValue(['judgmentDate', 'judgment_date']),
    judgmentText: Array.isArray(rawCase.judgmentText) 
      ? rawCase.judgmentText.join('\n') 
      : getValue(['judgmentText', 'Judgment']),
    judgmentUrl: Array.isArray(rawCase.judgmentUrl) 
      ? rawCase.judgmentUrl[0] 
      : (rawCase.judgmentLinks?.[0]?.url || ''),
    parties: getValue(['parties', 'Petitioner / Respondent']),
    advocates: getValue(['advocates', 'Petitioner/Respondent Advocate']),
    date: rawCase.date || '',
    createdAt: rawCase.createdAt || rawCase.created_at || new Date().toISOString(),
    updatedAt: rawCase.updatedAt || rawCase.updated_at || new Date().toISOString(),
    file_path: rawCase.file_path || '',
    judgmentType: getValue(['judgmentType', 'Judgment', 'judgment_type']),
    caseType: getValue(['caseType', 'case_type']),
    city: getValue(['city', 'City']),
    district: getValue(['district', 'District'])
  };
}
  // Validation function
  const validateSearchForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!searchParams.number.trim()) {
      errors.number = "Diary number is required";
    }

    if (!searchParams.year.trim()) {
      errors.year = "Year is required";
    } else if (!/^\d{4}$/.test(searchParams.year.trim())) {
      errors.year = "Year must be a 4-digit number";
    }

    if (!searchParams.court.trim()) {
      errors.court = "Court is required";
    }

    if(searchParams.court === "High Court") {
      if (!searchParams.caseType.trim()) {
        errors.caseType = "Case type is required";
      }
    }

    if(searchParams.court === "High Court") {
      if (!searchParams.city.trim()) {
        errors.city = "City is required";
      }
    }

    if(searchParams.court === "Supreme Court") {
      if (!searchParams.caseType.trim()) {
        errors.caseType = "Case type is required";
      }
    }

    if(searchParams.court === "District Court") {
      if (!searchParams.district.trim()) {
        errors.district = "District is required";
      }

      if (!searchParams.courtComplex.trim()) {
        errors.courtComplex = "Court complex is required";
      }

      if (!searchParams.caseType.trim()) {
        errors.caseType = "Case type is required";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

   

  const handleCaseExpand = async (caseItem: CaseData) => {
  if (!caseItem?.id) {
    console.error('Cannot expand - case item has no ID:', caseItem);
    return;
  }
  console.log("caseItem  handleExpand:", caseItem);

  const caseId = caseItem.id;
  const isExpanded = expandedCases[caseId];
  setExpandedCases(prev => ({ ...prev, [caseId]: !isExpanded }));

  if (!isExpanded && !caseDetails[caseId]) {
    try {
      setLoadingDetails(prev => ({ ...prev, [caseId]: true }));

      const diaryParts = caseItem.diaryNumber.split('/');
      const diaryNumber = diaryParts[0];
      const year = diaryParts[1];

      const searchUrl = new URL("/api/cases/search", window.location.origin);
      searchUrl.searchParams.append("diaryNumber", diaryNumber);
      searchUrl.searchParams.append("year", year);
      searchUrl.searchParams.append("court", caseItem.court);

      // Fallbacks for missing fields
      const caseType = caseItem.caseType || ""; // or use a sensible default
      const city = caseItem.city || "";      // or use a sensible default

      searchUrl.searchParams.append("caseType", caseType);
      searchUrl.searchParams.append("city", city);

      if (caseItem.judgmentType) {
        searchUrl.searchParams.append("judgmentType", caseItem.judgmentType);
      }
      if (caseItem.district) {
        searchUrl.searchParams.append("district", caseItem.district);
      }
      if (caseItem.bench) {
        searchUrl.searchParams.append("bench", caseItem.bench);
      }

      console.log(searchUrl.toString(), "searchUrl");
      const response = await fetch(searchUrl.toString());
      const data = await response.json();

      if (data.success && data.data?.length) {
        const sortedCases = data.data.sort((a: CaseData, b: CaseData) => {
          // ...sorting logic...
          // ...existing code...
        });

        setCaseDetails(prev => ({
          ...prev,
          [caseId]: sortedCases
        }));
        console.log("caseDetails:", caseDetails);
        console.log("Sorted cases:", sortedCases);

      } else {
        throw new Error(data.message || 'No case data returned from search');
      }
    } catch (error) {
      console.error('Search error:', error);
      setCaseDetails(prev => ({
        ...prev,
        [caseId]: [caseItem]
      }));
    } finally {
      setLoadingDetails(prev => ({ ...prev, [caseId]: false }));
    }
  }
};

  const fetchUserCases = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch('/api/cases/user-cases', {
        method: 'GET'
      });
      const data = await response.json();

      if (data.success && data.data) {
        setCases(data.data);
      } else {
        setError(data.message || 'Failed to fetch cases');
        toast.error(data.message || 'Failed to fetch cases');
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      setError('Failed to load cases');
      toast.error('Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    
    
    fetchUserCases();
  }, []);

  

  const handleSearchCase = async () => {
    setValidationErrors({});
    
    if (!validateSearchForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setFoundCases([]);
      setSelectedCases([]);
      setSelectAll(false);

      const searchUrl = new URL("/api/cases/search", window.location.origin);
      const searchUrlSC = new URL("/api/cases/search/supremeCourt", window.location.origin);
      const searchUrlDC = new URL("/api/cases/search/districtCourt", window.location.origin);

      // High Court Search URL
      searchUrl.searchParams.append("diaryNumber", searchParams.number);
      searchUrl.searchParams.append("year", searchParams.year);

      if(searchParams.number && searchParams.year){
        searchUrlSC.searchParams.append("diaryNumber", searchParams.number);
        searchUrlSC.searchParams.append("year", searchParams.year);
        searchUrlDC.searchParams.append("diaryNumber", searchParams.number);
        searchUrlDC.searchParams.append("year", searchParams.year);
      }
      
      if (searchParams.court) {
        searchUrl.searchParams.append("court", searchParams.court);
        searchUrlSC.searchParams.append("court", searchParams.court);
        searchUrlDC.searchParams.append("court", searchParams.court);
      }
      
      if (searchParams.judgmentType) {
        searchUrl.searchParams.append("judgmentType", searchParams.judgmentType);
      }
      
      if (searchParams.caseType) {
        searchUrl.searchParams.append("caseType", searchParams.caseType);
        searchUrlSC.searchParams.append("caseType", searchParams.caseType);
        searchUrlDC.searchParams.append("caseType", searchParams.caseType);
      }

      if (searchParams.city) {
        searchUrl.searchParams.append("city", searchParams.city);
      }

      if (searchParams.district) {
        searchUrlDC.searchParams.append("district", searchParams.district);
      }

      if (searchParams.bench) {
        searchUrl.searchParams.append("bench", searchParams.bench);
      }

      if (searchParams.courtComplex) {
        searchUrlDC.searchParams.append("courtComplex", searchParams.courtComplex);
      }

      let response;
      if(searchParams.court === "Supreme Court"){
        response = await fetch(searchUrlSC.toString());
      }else if(searchParams.court === "District Court"){
        response = await fetch(searchUrlDC.toString());
      }else{
        response = await fetch(searchUrl.toString());
      }
      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Search failed");
      }
 
if (responseData.data && responseData.data.length > 0) {
  // Flatten nested processedResults arrays
  // const flatCases = responseData.data.flatMap((d: any) => d.processedResults || []);

    let flatCases: any[] = [];

  // Check if data is DB result (array of cases) or scraped (array of objects with processedResults)
  if (responseData.data[0]?.diaryNumber) {
    // DB result: use directly
    flatCases = responseData.data;
  } else {
    // Scraped result: flatten processedResults
    flatCases = responseData.data.flatMap((d: any) => d.processedResults || []);
  }

  // Normalize all cases
  const normalizedCases = flatCases.map((rawCase: CaseData, i: number) => 
    normalizeCaseData(rawCase, i)
  );
  const sortedCases = normalizedCases.sort((a: CaseData, b: CaseData) => {
    if (!a.judgmentDate && !b.judgmentDate) return 0;
    if (!a.judgmentDate) return 1;
    if (!b.judgmentDate) return -1;

    const parseDate = (dateStr: string) => {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
      return new Date(dateStr);
    };

    const dateA = parseDate(a.judgmentDate);
    const dateB = parseDate(b.judgmentDate);

    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;

    return dateB.getTime() - dateA.getTime();
  });
    
  setFoundCases(sortedCases);
  toast.success(`Found ${sortedCases.length} cases (sorted by newest first)`);
}
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setValidationErrors({ general: errorMessage });
      toast.error(errorMessage || "Failed to search case");
    } finally {
      setIsLoading(false);
    }
  };

 

  const handleToggleSelectCase = (caseData: CaseData) => {
    setSelectedCases(prev => {
      const isSelected = prev.some(c => c.id === caseData.id);
      if (isSelected) {
        return prev.filter(c => c.id !== caseData.id);
      } else {
        return [...prev, caseData];
      }
    });
  };

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedCases([]);
    } else {
      setSelectedCases([...foundCases]);
    }
    setSelectAll(!selectAll);
  };

 
   

  const handleCreateCases = async () => {
  try {
    setIsSubmitting(true);
     
    // Ensure caseType and city are present for each selected case
    // Add bench to normalizedCases
 const normalizedFoundCases = foundCases.map(fc => ({
  ...fc,
  case_type: fc.caseType   || "",
  city: fc.city || "",
  bench: fc.bench || ""
}));

// Merge found values into only the selected cases
    const normalizedSelected = selectedCases.map(item => {
      const found = normalizedFoundCases.find(fc => fc.id === item.id || fc.diaryNumber === item.diaryNumber);
      return {
        ...item,
        // keep both camelCase and snake_case for backend compatibility
        caseType: item.caseType || found?.caseType || "",

        city: item.city || found?.city || "",
        bench: item.bench || found?.bench || ""
      };
    });

    // Deduplicate by diaryNumber (fallback to id)
    const uniqueMap = new Map<string, typeof normalizedSelected[number]>();
    for (const c of normalizedSelected) {
      const key = (c.diaryNumber || c.id || "").toString();
      if (!uniqueMap.has(key)) uniqueMap.set(key, c);
    }
    const uniqueCases = Array.from(uniqueMap.values());

      
 console.log("Unique cases to create:", uniqueCases);

    // console.log("Unique cases to create:", uniqueCases);


    const response = await fetch('/api/cases/user-cases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ selectedCases:   uniqueCases }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to save cases");
    }

    if (result.success) {
      toast.success(result.message);
      if (result.data.errors && result.data.errors.length > 0) {
        (Array.from(new Set(result.data.errors)) as string[]).forEach((error: string) => {
          toast.error(error);
        });
      }
    }
    await fetchUserCases();
    setShowNewCaseModal(false);
    setFoundCases([]);
    setSelectedCases([]);
    setSearchParams(defaultSearchParams);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to create cases";
    toast.error(errorMessage);
    console.error("Error in handleCreateCases:", err);
  } finally {
    setIsSubmitting(false);
  }
};

 useEffect(() => {
     console.log("Found cases updated:", foundCases);
   }, [foundCases]);
  const generateSignedUrlForCase = async (filePath: string) => {
    try {
      const response = await fetch('/api/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath,
          bucketName: process.env.NEXT_PUBLIC_HIGH_COURT_PDF_BUCKET || 'high-court-pdfs',
          expirationMinutes: 30
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate signed URL');
      }

      const data = await response.json();
      return data.signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  };

  const handlePdfClick = async (caseData: CaseData, event: React.MouseEvent) => {
    
      event.preventDefault();

      try {
        setLoadingUrls(prev => ({ ...prev, [caseData.id]: true }));
        const signedUrl = await generateSignedUrlForCase(caseData.file_path || '');

        window.open(signedUrl, '_blank', 'noopener,noreferrer');

        setSignedUrls(prev => ({ ...prev, [caseData.id]: signedUrl }));
      } catch (error) {
        console.error('Error generating signed URL:', error);
        toast.error('Failed to generate PDF link');
      } finally {
        setLoadingUrls(prev => ({ ...prev, [caseData.id]: false }));
      }
  };

  const handleBackToSearch = () => {
    setFoundCases([]);
    setSelectedCases([]);
    setSelectAll(false);
    setValidationErrors({}); // Clear errors on back to search
  };

  const handleCloseModal = () => {
    setShowNewCaseModal(false);
    setFoundCases([]);
    setSelectedCases([]);
    setSelectAll(false);
    setValidationErrors({});
    setSearchParams(defaultSearchParams);
  };

  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 bg-background">
        <div className="flex items-start justify-between mb-6">
          <Header headerTitle="Case Management" subTitle="Manage your cases" />

          <Button
            onClick={() => setShowNewCaseModal(true)}
            variant="primary"
          >
            <Plus className="w-4 h-4" />
            New Case
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search cases..."
              className=" pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Cases List */}
      <CaseList
        cases={cases}
        expandedCases={expandedCases}
        caseDetails={caseDetails}
        loadingDetails={loadingDetails}
        onCaseExpand={handleCaseExpand}
        handlePdfClick={handlePdfClick}
      />

      {/* Search Modal */}
      <SearchModal
        showModal={showNewCaseModal}
        foundCases={foundCases}
        selectedCases={selectedCases}
        selectAll={selectAll}
        searchParams={searchParams}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        loadingUrls={loadingUrls}
        errors={validationErrors}
        onClose={handleCloseModal}
        setSearchParams={setSearchParams}
        onSearch={handleSearchCase}
        onToggleSelectCase={handleToggleSelectCase}
        onToggleSelectAll={handleToggleSelectAll}
        handlePdfClick={handlePdfClick}
        onCreateCases={handleCreateCases}
        onBackToSearch={handleBackToSearch}
      />
    </div>
  );
} 