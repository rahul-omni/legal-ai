import { X } from "lucide-react";
import { CaseData, SearchParams, ValidationErrors } from "./types";
import { SearchForm } from "./SearchForm";
import { SearchResults } from "./SearchResults";

interface SearchModalProps {
  showModal: boolean;
  foundCases: CaseData[];
  selectedCases: CaseData[];
  selectAll: boolean;
  searchParams: SearchParams;
  isLoading: boolean;
  isSubmitting: boolean;
  loadingUrls: Record<string, boolean>;
  errors?: ValidationErrors;
  onClose: () => void;
  setSearchParams: (params: SearchParams) => void;
  onSearch: () => void;
  onToggleSelectCase: (caseData: CaseData) => void;
  onToggleSelectAll: () => void;
  handlePdfClick: (caseData: CaseData, event: React.MouseEvent) => void;
  onCreateCases: () => void;
  onBackToSearch: () => void;
}

export function SearchModal({
  showModal,
  foundCases,
  selectedCases,
  selectAll,
  searchParams,
  isLoading,
  isSubmitting,
  loadingUrls,
  errors,
  onClose,
  setSearchParams,
  onSearch,
  onToggleSelectCase,
  onToggleSelectAll,
  handlePdfClick,
  onCreateCases,
  onBackToSearch
}: SearchModalProps) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {foundCases.length > 0 ? "Select Case(s) to Create" : "Search CaseM"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[80vh]">
          {foundCases.length === 0 ? (
            <SearchForm
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              isLoading={isLoading}
              onSearch={onSearch}
              errors={errors}
            />
          ) : (
            <SearchResults
              foundCases={foundCases}
              selectedCases={selectedCases}
              selectAll={selectAll}
              loadingUrls={loadingUrls}
              onToggleSelectCase={onToggleSelectCase}
              onToggleSelectAll={onToggleSelectAll}
              handlePdfClick={handlePdfClick}
              onCreateCases={onCreateCases}
              onBackToSearch={onBackToSearch}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
} 