import { useState, useEffect } from "react";
import { Loader2, Plus, Search } from "lucide-react";
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

  const defaultSearchParams: SearchParams = {
    number: "",
    year: "",
    court: "",
    judgmentType: "",
    caseType: "",
    city: "",
    bench: "",
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
      district: getValue(['district', 'District']),
      courtComplex: getValue(['courtComplex', 'Court Complex']),
      courtType: getValue(['courtType', 'Court Type'])
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

    if (searchParams.court === "High Court") {
      if (!searchParams.caseType.trim()) {
        errors.caseType = "Case type is required";
      }
    }

    if (searchParams.court === "High Court") {
      if (!searchParams.city.trim()) {
        errors.city = "City is required";
      }
    }

    if (searchParams.court === "Supreme Court") {
      if (!searchParams.caseType.trim()) {
        errors.caseType = "Case type is required";
      }
    }

    if (searchParams.court === "District Court") {
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

    
  // Add NCLT Court validation
  if (searchParams.court === "Nclt Court") {
    if (!searchParams.bench.trim()) {
      errors.bench = "NCLT bench is required";
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

        let response;

        if (caseItem.court === "Supreme Court") {
          const searchUrlSC = new URL("/api/cases/search/supremeCourt", window.location.origin);
          searchUrlSC.searchParams.append("diaryNumber", diaryNumber);
          searchUrlSC.searchParams.append("year", year);
          searchUrlSC.searchParams.append("court", caseItem.court);
          searchUrlSC.searchParams.append("caseType", 'Diary Number');

          if (caseItem.judgmentType) {
            searchUrlSC.searchParams.append("judgmentType", caseItem.judgmentType);
          }


          response = await fetch(searchUrlSC.toString());
          console.log("response:", response);

        } else if (caseItem.court === "District Court") {
          const searchUrlDC = new URL("/api/cases/search/districtCourt", window.location.origin);
          searchUrlDC.searchParams.append("diaryNumber", diaryNumber);
          searchUrlDC.searchParams.append("year", year);
          searchUrlDC.searchParams.append("court", caseItem.court);

          if (caseItem.caseType) {
            searchUrlDC.searchParams.append("caseType", caseItem.caseType);
          }
          if (caseItem.district) {
            searchUrlDC.searchParams.append("district", caseItem.district);
          }
          if (caseItem.courtComplex) {
            searchUrlDC.searchParams.append("courtComplex", caseItem.courtComplex);
          }

          response = await fetch(searchUrlDC.toString());
        }else if (caseItem.court === "NCLT" || caseItem.court === "Nclt Court") {
          console.log("Full caseItem for NCLT:", JSON.stringify(caseItem, null, 2));
          console.log("caseItem.bench value:", caseItem.bench);
  
        // Add NCLT Court support
        const searchUrlNCLT = new URL("/api/cases/search/ncltCourt", window.location.origin);
        searchUrlNCLT.searchParams.append("diaryNumber", diaryNumber);
        searchUrlNCLT.searchParams.append("year", year);
        searchUrlNCLT.searchParams.append("court", caseItem.court);

        if (caseItem.caseType) {
          searchUrlNCLT.searchParams.append("caseType", caseItem.caseType);
        }
        if (caseItem.bench) {
          searchUrlNCLT.searchParams.append("bench", caseItem.bench);
        }
          if (caseItem.district) {
            searchUrlNCLT.searchParams.append("district", caseItem.district);
          }

        response = await fetch(searchUrlNCLT.toString());
      } else {
          const searchUrl = new URL("/api/cases/search", window.location.origin);
          searchUrl.searchParams.append("diaryNumber", diaryNumber);
          searchUrl.searchParams.append("year", year);
          searchUrl.searchParams.append("court", caseItem.court);

          if (caseItem.caseType) {
            searchUrl.searchParams.append("caseType", caseItem.caseType);
          }
          if (caseItem.city) {
            searchUrl.searchParams.append("city", caseItem.city);
          }
          if (caseItem.bench) {
            searchUrl.searchParams.append("bench", caseItem.bench);
          }
         
          response = await fetch(searchUrl.toString());
        }


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
    const searchUrlEastDelhi = new URL("/api/cases/search/districtEastDelhiCourt", window.location.origin);
    const searchUrlNCLT = new URL("/api/cases/search/ncltCourt", window.location.origin);

    // High Court Search URL
    searchUrl.searchParams.append("diaryNumber", `${searchParams.number}`);
    searchUrl.searchParams.append("year", searchParams.year);

    if (searchParams.number && searchParams.year) {
      searchUrlSC.searchParams.append("diaryNumber", searchParams.number);
      searchUrlSC.searchParams.append("year", searchParams.year);
      searchUrlDC.searchParams.append("diaryNumber", searchParams.number);
      searchUrlDC.searchParams.append("year", searchParams.year);
      searchUrlNCLT.searchParams.append("diaryNumber", searchParams.number);
      searchUrlNCLT.searchParams.append("year", searchParams.year);
      searchUrlEastDelhi.searchParams.append("diaryNumber", searchParams.number);
      searchUrlEastDelhi.searchParams.append("year", searchParams.year);
    }

    if (searchParams.court) {
      searchUrl.searchParams.append("court", searchParams.court);
      searchUrlSC.searchParams.append("court", searchParams.court);
      searchUrlDC.searchParams.append("court", searchParams.court);
      searchUrlNCLT.searchParams.append("court", searchParams.court);
      searchUrlEastDelhi.searchParams.append("court", searchParams.court);
    }

    if (searchParams.judgmentType) {
      searchUrl.searchParams.append("judgmentType", searchParams.judgmentType);
    }

    if (searchParams.caseType) {
      searchUrl.searchParams.append("caseType", searchParams.caseType);
      searchUrlSC.searchParams.append("caseType", searchParams.caseType);
      searchUrlDC.searchParams.append("caseType", searchParams.caseType);
      searchUrlNCLT.searchParams.append("caseType", searchParams.caseType);
      searchUrlEastDelhi.searchParams.append("caseType", searchParams.caseType);
    }

    if (searchParams.city) {
      searchUrl.searchParams.append("city", searchParams.city);
    }

    if (searchParams.district) {
      searchUrlDC.searchParams.append("district", searchParams.district);
      searchUrlEastDelhi.searchParams.append("district", searchParams.district);
    }

    if (searchParams.bench) {
      searchUrl.searchParams.append("bench", searchParams.bench);
      searchUrlNCLT.searchParams.append("bench", searchParams.bench);

    }

    if (searchParams.courtComplex) {
      searchUrlDC.searchParams.append("courtComplex", searchParams.courtComplex);
      searchUrlEastDelhi.searchParams.append("courtComplex", searchParams.courtComplex);
    }

    let response;
    if (searchParams.court === "Supreme Court") {
      response = await fetch(searchUrlSC.toString());
    } else if (searchParams.court === "District Court") {
      if(searchParams.district === "East District Court, Delhi") {
        response = await fetch(searchUrlEastDelhi.toString());
      }else {
      response = await fetch(searchUrlDC.toString());
      }

    } else if (searchParams.court === "Nclt Court") {
      response = await fetch(searchUrlNCLT.toString());
    } else {
      response = await fetch(searchUrl.toString());
    }
    
    const responseData = await response.json();

    if (!response.ok || !responseData.success) {
      throw new Error(responseData.message || "Search failed");
    }

    if (responseData.data && responseData.data.length > 0) {
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
        case_type: fc.caseType || "",
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
        body: JSON.stringify({ selectedCases: uniqueCases }),
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

  console.log("cases", cases);
  console.log("expandedCases", expandedCases);
  console.log("caseDetails", caseDetails);
  console.log("loadingDetails", loadingDetails);

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
            Add Cases
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

      {isLoading ? (
        <div className="bg-background pt-6">
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 bg-background-light rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
            <p className="text-muted text-sm">Loading cases...</p>
          </div>
        </div>
      ) : cases.length > 0 ? (
        <>
          {/* Cases List */}
          <CaseList
            cases={cases}
          />
        </>
      ) : (
        <div className="bg-background pt-6">
          <div className="flex flex-col items-center justify-center text-center py-12">
            {/* Icon */}
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <div className="relative">
                {/* Document/File Icon */}
                <svg className="w-14 h-14 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
                {/* Search Icon */}
                <svg className="w-7 h-7 text-gray-500 absolute -top-1 -right-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </div>
            </div>
            {/* Main Message */}
            <h3 className="text-xl font-semibold text-gray-700">
              No cases found
            </h3>
            {/* Guidance Text */}
            <p className="text-gray-500 max-w-md">
              Add new case to subscribe and get started.
            </p>
          </div>
        </div>
      )}



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