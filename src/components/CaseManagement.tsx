
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

      const response = await fetch(searchUrl.toString());
      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Search failed");
      }

      if (responseData.data && responseData.data.length > 0) {
        setFoundCases(responseData.data);
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
      body: JSON.stringify({ diaryNumber :firstDiaryNumber }),
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
      number: "", year:"", court: ""})

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to create cases";
    toast.error(errorMessage);
    console.error("Error in handleCreateCases:", err);
  } finally {
    setIsSubmitting(false);
  }
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
        className="bg-white border rounded-md hover:shadow-sm transition-shadow text-xs"
      >
        {/* Case header - clickable */}
        <div 
          className="flex justify-between items-center p-2 border-b cursor-pointer"
          onClick={() => handleCaseExpand(caseItem)}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {index + 1}. {caseItem.caseNumber}
            </span>
             <span className="font-medium text-gray-900">
                  Diary Number: {caseItem.diaryNumber}
                </span>
            {caseItem.judgmentDate && (
              <span className="text-gray-500">
                (Judgment: {caseItem.judgmentDate})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {loadingDetails[caseItem.id] ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${
                  expandedCases[caseItem.id] ? 'rotate-180' : ''
                }`}
              />
            )}
          </div>
        </div>

        {/* Expanded content */}
        {expandedCases[caseItem.id] && (
          <div className="p-4">
            {caseDetails[caseItem.id] ? (
              <div className="space-y-4">
                {/* {caseDetails[caseItem.id].map((detail, idx) => (
                  <div key={`${detail.id}-${idx}`} className="border-b pb-4 last:border-0">
                    <h4 className="font-medium mb-2">Judgment {idx + 1}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs">Court:</p>
                        <p className="font-medium">{detail.court}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Date:</p>
                        <p className="font-medium">
                          {new Date(detail.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="text-gray-500 text-xs">Parties:</p>
                      <p className="font-medium">{detail.parties}</p>
                    </div>

                    <div className="mt-2">
                      <p className="text-gray-500 text-xs">Advocates:</p>
                      <p className="font-medium">
                        {detail.advocates || "N/A"}
                      </p>
                    </div>

                    <div className="mt-2">
                      <p className="text-gray-500 text-xs">Bench:</p>
                      <p className="font-medium">{detail.bench}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-gray-500 text-xs">Judgment Date:</p>
                        <p className="font-medium">
                          {detail.judgmentDate || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Diary Number:</p>
                        <p className="font-medium">{detail.diaryNumber}</p>
                      </div>
                    </div>

                    {detail.judgmentUrl && (
                      <div className="mt-3">
                        <a
                          href={detail.judgmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:underline text-xs"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          View Judgment PDF
                        </a>
                      </div>
                    )}
                  </div>
                ))} */}

                {caseDetails[caseItem.id].map((detail, idx) => (
  <div key={`${detail.id}-${idx}`} className="border-b pb-4 last:border-0">
    <div className="flex justify-between items-start mb-3">
      <h4 className="font-medium text-sm text-blue-600">Judgment {idx + 1}</h4>
      {detail.judgmentDate && (
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
          {detail.judgmentDate}
        </span>
      )}
    </div>

    <div className="flex flex-wrap gap-4">
      {/* Column 1 - Case Info */}
      <div className="flex-1 min-w-[200px] space-y-2">
        <div>
          <p className="text-gray-500 text-xs">Court</p>
          <p className="font-medium text-sm">{detail.court}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Date</p>
          <p className="font-medium text-sm">
            {new Date(detail.date).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Diary Number</p>
          <p className="font-medium text-sm">{detail.diaryNumber}</p>
        </div>
      </div>

      {/* Column 2 - Parties */}
      <div className="flex-1 min-w-[200px] space-y-2">
        <div>
          <p className="text-gray-500 text-xs">Parties</p>
          <p className="font-medium text-sm">{detail.parties}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Advocates</p>
          <p className="font-medium text-sm">
            {detail.advocates || "N/A"}
          </p>
        </div>
      </div>

      {/* Column 3 - Bench & Actions */}
      <div className="flex-1 min-w-[200px] space-y-2">
        <div>
          <p className="text-gray-500 text-xs">Bench</p>
          <p className="font-medium text-sm">{detail.bench}</p>
        </div>
        {detail.judgmentUrl && (
          <div className="mt-2">
            <a
              href={detail.judgmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:underline text-xs bg-blue-50 px-2 py-1 rounded"
            >
              <FileText className="w-3 h-3 mr-1" />
              View Judgment PDF
            </a>
          </div>
        )}
      </div>
    </div>
  </div>
))}
              </div>
            ) : (
              <div className="text-center py-2 text-gray-500 text-xs">
                {loadingDetails[caseItem.id] ? 'Loading...' : 'Failed to load details'}
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
                  setSearchParams({ number: "", year: "", court: "" });
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
                      <h4 className="font-medium text-gray-800">
                        Found {foundCases.length}  Order Related to this dairy number {foundCases[0].diaryNumber}
                      </h4>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="selectAll"
                          checked={selectAll}
                          onChange={handleToggleSelectAll}
                          className="mr-2 h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor="selectAll" className="text-sm text-gray-700">
                          Select All
                        </label>
                      </div>
                    </div>
                    
                    {foundCases.map((caseData) => (
                      <div 
                        key={caseData.id} 
                        className={`bg-gray-50 p-4 rounded-md border ${
                          selectedCases.some(c => c.id === caseData.id) ? 'border-blue-500' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-blue-600">
                            {caseData.diaryNumber} - {caseData.parties.split("/")[0]}
                          </h5>
                          {/* <button
                            onClick={() => handleToggleSelectCase(caseData)}
                            className={`px-3 py-1 rounded text-sm ${
                              selectedCases.some(c => c.id === caseData.id) 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {selectedCases.some(c => c.id === caseData.id) ? 'Selected' : 'Select'}
                          </button> */}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><span className="text-gray-600">Case Number:</span> {caseData.caseNumber}</p>
                          <p><span className="text-gray-600">Judgment Date:</span> {caseData.judgmentDate}</p>
                          <p><span className="text-gray-600">Bench:</span> {caseData.bench}</p>
                          <p><span className="text-gray-600">Court:</span> {caseData.court}</p>
                          {caseData.judgmentUrl && (
                            <p className="col-span-2">
                              <span className="text-gray-600">Judgment:</span> 
                              <a 
                                href={caseData.judgmentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 hover:underline ml-1"
                              >
                                View PDF
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
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
