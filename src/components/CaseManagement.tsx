
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  X,
  FileText,
  Loader2,
  Download,
  Calendar,
  Check,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { HIGH_COURT_CASE_TYPES, SUPREME_COURT_CASE_TYPES } from "@/lib/constants";


interface CaseData {
  id: string;
  serialNumber: string;
  diaryNumber: string;
  caseNumber: string;
  parties: string;
  advocates: string;
  bench: string;
  judgmentBy: string;
  judgmentDate: string;
  judgmentText: string;
  judgmentUrl: string;
  court: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  file_path?: string; // Added for High Court signed URLs
  caseType?: string;
  judgmentType?: string;
}


export function CaseManagement() {
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundCases, setFoundCases] = useState<CaseData[]>([]);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCases, setSelectedCases] = useState<CaseData[]>([]); // Changed to array for multiple selection
  const [selectAll, setSelectAll] = useState(false);

  const [searchParams, setSearchParams] = useState({
    number: "",
    year: "",
    court: "",
    judgmentType: "",
    caseType: "",
  });
  // Add a new state for tracking the newly created case
  const [newlyCreatedCase, setNewlyCreatedCase] = useState<CaseData | null>(null);
  // Add this to your existing state declarations

  const [expandedCases, setExpandedCases] = useState<Record<string, boolean>>({});
  const [caseDetails, setCaseDetails] = useState<Record<string, CaseData[]>>({}); // Changed to store array of cases
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

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

    // Toggle expansion state
    setExpandedCases(prev => ({ ...prev, [caseId]: !isExpanded }));

    if (!isExpanded && !caseDetails[caseId]) {
      try {
        setLoadingDetails(prev => ({ ...prev, [caseId]: true }));

        console.log(`Fetching details for diary ${caseItem.diaryNumber}`);
        const response = await fetch(`/api/cases/dairynumber?diaryNumber=${caseItem.diaryNumber}`);
        const data = await response.json();
        console.log('API response:', data);

        if (data.success && data.data?.length) {
          // Store ALL cases from the response
          setCaseDetails(prev => ({
            ...prev,
            [caseId]: data.data
          }));
        } else {
          throw new Error(data.message || 'No case data returned');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        // Fallback to the original case item as single item array
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
        // console.log("Fetched cases:", data.data);

        setCases(data.data);

        // console.log("cases:", cases);

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
  console.log("cases:", cases);


  const handleSearchCase = async () => {
    try {
      setIsLoading(true);
      setError("");
      setFoundCases([]);
      setSelectedCases([]);
      setSelectAll(false);

      if (!searchParams.number || !searchParams.year) {
        throw new Error("Both diary number and year are required.");
      }

      const searchUrl = new URL("/api/cases/search", window.location.origin);
      searchUrl.searchParams.append("diaryNumber", searchParams.number);
      searchUrl.searchParams.append("year", searchParams.year);
      if (searchParams.court) {
        searchUrl.searchParams.append("court", searchParams.court);
      }
      if (searchParams.judgmentType) {
        searchUrl.searchParams.append("judgmentType", searchParams.judgmentType);
      }
      if (searchParams.caseType) {
        searchUrl.searchParams.append("caseType", searchParams.caseType);
      }

      const response = await fetch(searchUrl.toString());
      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Search failed");
      }

      if (responseData.data && responseData.data.length > 0) {
        setFoundCases(responseData.data);
        console.log("Found cases:", responseData.data);
        toast.success(`Found ${responseData.data.length} cases`);
      } else {
        toast.success(responseData.message || "No matching cases found");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
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

      // Extract case IDs from selected cases
      const diaryNumbers = selectedCases.map(caseData => caseData.diaryNumber);
      console.log("Selected diary numbers:", diaryNumbers);

      // Take only the first diary number
      const firstDiaryNumber = diaryNumbers[0];
      const response = await fetch('/api/cases/user-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ diaryNumber: firstDiaryNumber }),
      });

      const result = await response.json();
      console.log("Create cases response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to save cases");
      }

      // Show success message based on the actual API response
      if (result.success) {
        toast.success(`Successfully created Order for Diary Number ${result.data.createdCase.diaryNumber}`);
        setNewlyCreatedCase(result.data.createdCase);
      } else {
        toast.error(result.message || "Case processed but got some errors");
      }

      await fetchUserCases(); // Refresh the cases list
      // Update UI
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

  // Add this state for signed URLs
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});

  // Add this function to generate signed URL
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

  // Add this function to handle PDF link clicks
  const handlePdfClick = async (caseData: CaseData, event: React.MouseEvent) => {
    console.log("caseData:", caseData);

    // Only generate signed URL for High Court with JUDGEMENT type

    if (caseData.court === 'High Court' &&
      caseData.judgmentType === 'JUDGEMENT' &&
      caseData.file_path) {
      console.log("Generating signed URL for High Court with JUDGEMENT type");
      event.preventDefault(); // Prevent default link behavior

      try {
        setLoadingUrls(prev => ({ ...prev, [caseData.id]: true }));
        const signedUrl = await generateSignedUrlForCase(caseData.file_path);

        // Open the signed URL in a new tab
        window.open(signedUrl, '_blank', 'noopener,noreferrer');

        // Store the URL for future use (optional)
        setSignedUrls(prev => ({ ...prev, [caseData.id]: signedUrl }));
      } catch (error) {
        console.error('Error generating signed URL:', error);
        toast.error('Failed to generate PDF link');
      } finally {
        setLoadingUrls(prev => ({ ...prev, [caseData.id]: false }));
      }
    }
    // For all other cases (Supreme Court, other High Court types, etc.), let the default link behavior handle it
    // No need to prevent default or do anything special
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

      <div className="grid grid-cols-1 gap-2 mt-2 p-4">
        {cases.map((caseItem, index) => {
          if (!caseItem.id) {
            console.error('Rendering case with no ID:', caseItem);
            return null;
          }
          return (
            <div
              key={caseItem.id}
              className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 text-sm"
            >
              {/* Case header - clickable */}
              <div 
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleCaseExpand(caseItem)}
              >
                <div className="flex items-center gap-6 flex-1">
                  {/* Court Badge */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {caseItem.court}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600 font-medium">
                        Diary: {caseItem.diaryNumber}
                      </span>
                    </div>
                  </div>

                  {/* Court Information */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {caseItem.court}
                      </span>
                      {caseItem.caseType && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {caseItem.caseType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Judgment Information */}
                  <div className="flex items-center gap-4">
                    {caseItem.judgmentDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 text-sm">
                          {caseItem.judgmentDate}
                        </span>
                      </div>
                    )}
                    {caseItem.judgmentBy && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">By:</span>
                        <span className="text-gray-700 text-sm font-medium">
                          {caseItem.judgmentBy}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Parties Information */}
                  <div className="flex-1 min-w-0">
                    {caseItem.parties && (
                      <div className="truncate">
                        <span className="text-gray-500 text-sm">Parties:</span>
                        <span className="text-gray-700 text-sm font-medium ml-1">
                          {caseItem.parties}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expand/Collapse Indicator */}
                <div className="flex items-center gap-3 ml-4">
                  {loadingDetails[caseItem.id] ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  ) : (
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        expandedCases[caseItem.id] ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {expandedCases[caseItem.id] && (
                <div className="bg-gray-50 border-t border-gray-200">
                  {caseDetails[caseItem.id] ? (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Case Details
                            </h3>
                            <p className="text-sm text-gray-600">
                              Diary Number: {caseItem.diaryNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            {caseDetails[caseItem.id].length} judgment{caseDetails[caseItem.id].length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {caseDetails[caseItem.id].map((detail, idx) => (
                          <div key={`${detail.id}-${idx}`} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-sm">
                                      {idx + 1}
                                    </span>
                                  </div>
                                  <h4 className="font-semibold text-gray-900">
                                    Judgment {idx + 1}
                                  </h4>
                                </div>
                                {detail.judgmentDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600 font-medium">
                                      {detail.judgmentDate}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="p-6">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Case Information */}
                                <div className="space-y-4">
                                  <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                    Case Information
                                  </h5>
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                      <span className="text-sm text-gray-600">Court</span>
                                      <span className="text-sm font-semibold text-gray-900">{detail.court}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                      <span className="text-sm text-gray-600">Date</span>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {new Date(detail.date).toLocaleDateString('en-GB')}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                      <span className="text-sm text-gray-600">Diary Number</span>
                                      <span className="text-sm font-semibold text-gray-900">{detail.diaryNumber}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Parties & Advocates */}
                                <div className="space-y-4">
                                  <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                    Parties & Advocates
                                  </h5>
                                  <div className="space-y-3">
                                    <div className="py-2 border-b border-gray-100">
                                      <span className="text-sm text-gray-600 block mb-1">Parties</span>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {detail.parties || 'Not specified'}
                                      </span>
                                    </div>
                                    <div className="py-2 border-b border-gray-100">
                                      <span className="text-sm text-gray-600 block mb-1">Advocates</span>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {detail.advocates || 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Bench & Actions */}
                                <div className="space-y-4">
                                  <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                    Bench & Actions
                                  </h5>
                                  <div className="space-y-3">
                                    <div className="py-2 border-b border-gray-100">
                                      <span className="text-sm text-gray-600 block mb-1">Bench</span>
                                      <span className="text-sm font-semibold text-gray-900">{detail.bench}</span>
                                    </div>
                                    {detail.judgmentUrl && (
                                      <div className="pt-2">
                                        <a
                                          href={detail.judgmentUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                          <FileText className="w-4 h-4" />
                                          View Judgment PDF
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                      </div>
                      <p className="text-gray-500 text-sm">
                        {loadingDetails[caseItem.id] ? 'Loading case details...' : 'Failed to load details'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Search and Create Case Modal */}
      {showNewCaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                {foundCases.length > 0 ? "Select Case(s) to Create" : "Search Case"}
              </h3>
              <button
                onClick={() => {
                  setShowNewCaseModal(false);
                  setFoundCases([]);
                  setSelectedCases([]);
                  setSelectAll(false);
                  setSearchParams({ number: "", year: "", court: "", judgmentType: "", caseType: "" });
                }}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {foundCases.length === 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diary Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={searchParams.number}
                        onChange={(e) =>
                          setSearchParams({ ...searchParams, number: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. 72381/1989"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={searchParams.year}
                        onChange={(e) =>
                          setSearchParams({ ...searchParams, year: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. 1989"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Court
                      </label>
                      <select
                        value={searchParams.court}
                        onChange={(e) =>
                          setSearchParams({ ...searchParams, court: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select court</option>
                        <option value="Supreme Court">Supreme Court</option>
                        <option value="High Court">High Court</option>
                        <option value="District Court">District Court</option>
                      </select>
                    </div>
                  </div>

                  {searchParams.court === 'High Court' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Judgment Type
                        </label>
                        <select
                          value={searchParams.judgmentType}
                          onChange={(e) =>
                            setSearchParams({ ...searchParams, judgmentType: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select judgment type</option>
                          <option value="JUDGEMENT">JUDGEMENT</option>
                          <option value="ORDER">ORDER</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {searchParams.court && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Case Type
                        </label>
                        <select
                          value={searchParams.caseType}
                          onChange={(e) =>
                            setSearchParams({ ...searchParams, caseType: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select case type</option>
                          {searchParams.court === 'High Court' ? HIGH_COURT_CASE_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          )) : SUPREME_COURT_CASE_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleSearchCase}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        "Search Case"
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <h4 className="font-semibold text-gray-800 text-lg">
                            Search Results
                          </h4>
                        </div>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                          {foundCases.length} case{foundCases.length !== 1 ? 's' : ''} found
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="selectAll"
                            checked={selectAll}
                            onChange={handleToggleSelectAll}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">
                            Select All
                          </label>
                        </div>
                        <div className="text-sm text-gray-500">
                          Diary: {foundCases[0]?.diaryNumber}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      {foundCases.map((caseData, index) => (
                        <div 
                          key={caseData.id} 
                          className={`border-b border-gray-100 last:border-b-0 transition-all duration-200 ${
                            selectedCases.some(c => c.id === caseData.id) 
                              ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <span className="text-blue-600 font-semibold text-sm">
                                        {index + 1}
                                      </span>
                                    </div>
                                    <div>
                                      <h5 className="font-semibold text-gray-900 text-lg">
                                        {caseData?.caseType} - {caseData.diaryNumber}
                                      </h5>
                                      <p className="text-sm text-gray-600">
                                        {caseData?.parties?.split("/")[0]}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                      {caseData.court}
                                    </span>
                                    {caseData.judgmentType && (
                                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                        {caseData.judgmentType}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500 font-medium">Case Number:</span>
                                    <p className="text-gray-900 font-semibold">{caseData.caseNumber || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 font-medium">Judgment Date:</span>
                                    <p className="text-gray-900 font-semibold">{caseData.judgmentDate || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 font-medium">Bench:</span>
                                    <p className="text-gray-900 font-semibold">{caseData.bench || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 font-medium">Status:</span>
                                    <p className="text-gray-900 font-semibold">Available</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 ml-4">
                                {caseData.judgmentUrl && 
                                 !(caseData.court === 'High Court' && caseData.judgmentType === 'ORDER') && (
                                  <a 
                                    href={Array.isArray(caseData.judgmentUrl) ? caseData.judgmentUrl[0] : caseData.judgmentUrl}
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                    onClick={(e) => handlePdfClick(caseData, e)}
                                  >
                                    <FileText className="w-4 h-4" />
                                    {caseData.court === 'High Court' && 
                                     caseData.judgmentType === 'JUDGEMENT' && 
                                     loadingUrls[caseData.id] ? (
                                      <span>Generating...</span>
                                    ) : (
                                      "View PDF"
                                    )}
                                  </a>
                                )}
                                
                                <button
                                  onClick={() => handleToggleSelectCase(caseData)}
                                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    selectedCases.some(c => c.id === caseData.id) 
                                      ? 'bg-green-600 text-white shadow-sm hover:bg-green-700' 
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {selectedCases.some(c => c.id === caseData.id) ? (
                                    <>
                                      <Check className="w-4 h-4" />
                                      Selected
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4" />
                                      Select
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {selectedCases.length} case(s) selected
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setFoundCases([]);
                          setSelectedCases([]);
                          setSelectAll(false);
                        }}
                        className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
                      >
                        Back to Search
                      </button>
                      <button
                        onClick={handleCreateCases}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1 disabled:opacity-50"
                        disabled={selectedCases.length === 0 || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Create {selectedCases.length > 1 ? 'Cases' : 'Case'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
