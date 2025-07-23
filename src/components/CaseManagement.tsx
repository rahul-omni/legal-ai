import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { CaseData, SearchParams, ValidationErrors } from "./caseManagementComponents/types";
import { CaseList } from "./caseManagementComponents/CaseList";
import { SearchModal } from "./caseManagementComponents/SearchModal";

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

  const [searchParams, setSearchParams] = useState<SearchParams>({
    number: "",
    year: "",
    court: "",
    judgmentType: "",
    caseType: "",
  });

  const [newlyCreatedCase, setNewlyCreatedCase] = useState<CaseData | null>(null);
  const [expandedCases, setExpandedCases] = useState<Record<string, boolean>>({});
  const [caseDetails, setCaseDetails] = useState<Record<string, CaseData[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});

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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCaseExpand = async (caseItem: CaseData) => {
    if (!caseItem?.id) {
      console.error('Cannot expand - case item has no ID:', caseItem);
      return;
    }

    const caseId = caseItem.id;
    console.group(`Handling expand for case ${caseId}`);

    const isExpanded = expandedCases[caseId];
    console.log('Current states:', {
      expanded: expandedCases,
      details: caseDetails,
      loading: loadingDetails
    });

    setExpandedCases(prev => ({ ...prev, [caseId]: !isExpanded }));

    if (!isExpanded && !caseDetails[caseId]) {
      try {
        setLoadingDetails(prev => ({ ...prev, [caseId]: true }));

        const diaryParts = caseItem.diaryNumber.split('/');
        const diaryNumber = diaryParts[0];
        const year = diaryParts[1];

        console.log(`Searching for cases with diary: ${diaryNumber}, year: ${year}, court: ${caseItem.court}`);

        const searchUrl = new URL("/api/cases/search", window.location.origin);
        searchUrl.searchParams.append("diaryNumber", diaryNumber);
        searchUrl.searchParams.append("year", year);
        searchUrl.searchParams.append("court", caseItem.court);
        
        // Only append judgmentType if it exists and is not empty
        if (caseItem.judgmentType) {
          searchUrl.searchParams.append("judgmentType", caseItem.judgmentType);
        }
        
        // Only append caseType if it exists and is not empty
        if (caseItem.caseType) {
          searchUrl.searchParams.append("caseType", caseItem.caseType);
        }
        
        // Only append city if it exists
        if (caseItem?.city) {
          searchUrl.searchParams.append("city", caseItem.city);
        }
        
        // Only append district if it exists
        if (caseItem?.district) {
          searchUrl.searchParams.append("district", caseItem.district);
        }

        const response = await fetch(searchUrl.toString());
        const data = await response.json();
        console.log('Search API response:', data);

        if (data.success && data.data?.length) {
          const sortedCases = data.data.sort((a: CaseData, b: CaseData) => {
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
          
          setCaseDetails(prev => ({ 
            ...prev, 
            [caseId]: sortedCases 
          }));
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
    console.groupEnd();
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
    // Clear previous errors
    setValidationErrors({});
    
    // Validate form
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
      searchUrl.searchParams.append("diaryNumber", searchParams.number);
      searchUrl.searchParams.append("year", searchParams.year);
      
      // Only append court if it's selected
      if (searchParams.court) {
        searchUrl.searchParams.append("court", searchParams.court);
      }
      
      // Only append judgmentType if it's selected (not empty/"All")
      if (searchParams.judgmentType) {
        searchUrl.searchParams.append("judgmentType", searchParams.judgmentType);
      }
      
      // Only append caseType if it's selected (not empty/"All Case Types")
      if (searchParams.caseType) {
        searchUrl.searchParams.append("caseType", searchParams.caseType);
      }

      console.log("Optimized Search URL:", searchUrl.toString());
      console.log("Search Parameters:", {
        diaryNumber: searchParams.number,
        year: searchParams.year,
        court: searchParams.court || "All Courts",
        judgmentType: searchParams.judgmentType || "All Judgment Types", 
        caseType: searchParams.caseType || "All Case Types"
      });

      const response = await fetch(searchUrl.toString());
      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Search failed");
      }

      if (responseData.data && responseData.data.length > 0) {
        // Sort cases by judgment date (newest first)
        const sortedCases = responseData.data.sort((a: CaseData, b: CaseData) => {
          // Handle cases where judgmentDate might be null or undefined
          if (!a.judgmentDate && !b.judgmentDate) return 0;
          if (!a.judgmentDate) return 1; // Put cases without dates at the end
          if (!b.judgmentDate) return -1; // Put cases without dates at the end
          
          // Convert DD-MM-YYYY format to Date objects for proper comparison
          const parseDate = (dateStr: string) => {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
              // DD-MM-YYYY format: rearrange to YYYY-MM-DD for Date constructor
              return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
            return new Date(dateStr);
          };
          
          const dateA = parseDate(a.judgmentDate);
          const dateB = parseDate(b.judgmentDate);
          
          // Handle invalid dates
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
          if (isNaN(dateA.getTime())) return 1; // Invalid dates go to end
          if (isNaN(dateB.getTime())) return -1; // Invalid dates go to end
          
          return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
        });

        setFoundCases(sortedCases);
        console.log("Found and sorted cases:", sortedCases);
        toast.success(`Found ${sortedCases.length} cases (sorted by newest first)`);
      } else {
        toast.success(responseData.message || "No matching cases found");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
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

      console.log("Selected cases:", selectedCases);

      const response = await fetch('/api/cases/user-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedCases: selectedCases }),
      });

      const result = await response.json();
      console.log("Create cases response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to save cases");
      }

      if (result.success) {
        toast.success(result.message);
        if (result.data.errors && result.data.errors.length > 0) {
          result.data.errors.forEach((error: string) => {
            toast.error(error);
          });
        }
      } else {
        toast.error(result.message || "Case processed but got some errors");
      }

      await fetchUserCases();
      setShowNewCaseModal(false);
      setFoundCases([]);
      setSelectedCases([]);
      setSearchParams({
        number: "", year: "", court: "", judgmentType: "", caseType: ""
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create cases";
      toast.error(errorMessage);
      console.error("Error in handleCreateCases:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    console.log("caseData:", caseData);

    if (caseData.court === 'High Court' &&
      caseData.judgmentType === 'JUDGEMENT' &&
      caseData.file_path) {
      console.log("Generating signed URL for High Court with JUDGEMENT type");
      event.preventDefault();

      try {
        setLoadingUrls(prev => ({ ...prev, [caseData.id]: true }));
        const signedUrl = await generateSignedUrlForCase(caseData.file_path);

        window.open(signedUrl, '_blank', 'noopener,noreferrer');

        setSignedUrls(prev => ({ ...prev, [caseData.id]: signedUrl }));
      } catch (error) {
        console.error('Error generating signed URL:', error);
        toast.error('Failed to generate PDF link');
      } finally {
        setLoadingUrls(prev => ({ ...prev, [caseData.id]: false }));
      }
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
    setSearchParams({ number: "", year: "", court: "", judgmentType: "", caseType: "" });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Case Management
          </h1>

          <button
            onClick={() => setShowNewCaseModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Case
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cases..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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