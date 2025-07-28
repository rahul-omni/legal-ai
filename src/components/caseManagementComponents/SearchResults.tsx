import { FileText, Loader2 } from "lucide-react";
import { CaseData } from "./types";

interface SearchResultsProps {
  foundCases: CaseData[];
  selectedCases: CaseData[];
  selectAll: boolean;
  loadingUrls: Record<string, boolean>;
  onToggleSelectCase: (caseData: CaseData) => void;
  onToggleSelectAll: () => void;
  handlePdfClick: (caseData: CaseData, event: React.MouseEvent) => void;
  onCreateCases: () => void;
  onBackToSearch: () => void;
  isSubmitting: boolean;
}

export function SearchResults({
  foundCases,
  selectedCases,
  selectAll,
  loadingUrls,
  onToggleSelectCase,
  onToggleSelectAll,
  handlePdfClick,
  onCreateCases,
  onBackToSearch,
  isSubmitting
}: SearchResultsProps) {
  const isSelected = (caseData: CaseData) => selectedCases.some(c => c.id === caseData.id);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h4 className="text-xl font-semibold text-gray-900">
                Search Results
              </h4>
            </div>
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full border border-blue-200">
              {foundCases.length} case{foundCases.length !== 1 ? 's' : ''} found
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectAll}
                onChange={onToggleSelectAll}
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="selectAll" className="text-sm font-semibold text-gray-700 cursor-pointer">
                Select All
              </label>
            </div>
            <div className="text-sm text-gray-500 font-medium">
              Diary: {foundCases[0]?.diaryNumber}
            </div>
          </div>
        </div>

        {/* Cases Grid */}
        <div className="space-y-3">
          {foundCases.map((caseData, index) => (
            <div
              key={caseData.id}
              onClick={() => onToggleSelectCase(caseData)}
              className={`relative border-2 rounded-xl transition-all duration-200 cursor-pointer ${
                isSelected(caseData)
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              

              {/* Checkbox */}
              <div className="absolute top-4 left-4 z-10">
                <input
                  type="checkbox"
                  checked={isSelected(caseData)}
                  onChange={() => onToggleSelectCase(caseData)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>

              <div className="p-6 pl-14">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Case Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-900 text-lg">
                            {caseData?.caseType} - {caseData.diaryNumber}
                          </h5>
                          <p className="text-sm text-gray-600 font-medium">
                            {caseData?.parties?.split("/")[0]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                          {caseData.court}
                        </span>
                        {caseData.judgmentType && (
                          <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                            {caseData.judgmentType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Case Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Case Number</span>
                        <p className="text-sm text-gray-900 font-semibold">{caseData.caseNumber || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Judgment Date</span>
                        <p className="text-sm text-gray-900 font-semibold">{caseData.judgmentDate || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Bench</span>
                        <p className="text-sm text-gray-900 font-semibold">{caseData.bench || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide mr-2">Status</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Available
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PDF Button */}
                  {caseData.judgmentUrl &&
                    !(caseData.court === 'High Court' && caseData.judgmentType === 'ORDER') && (
                      <div className="ml-6 flex-shrink-0">
                        <a
                          href={Array.isArray(caseData.judgmentUrl) ? caseData.judgmentUrl[0] : caseData.judgmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-primary bg-info-light rounded-lg hover:bg-info transition-colors border border-info/20"
                          onClick={(e) => {
                            if (caseData.court === 'High Court' && 
                                caseData.judgmentType === 'JUDGMENT' &&
                                caseData.file_path) {
                              handlePdfClick(caseData, e);
                            }
                          }}
                        >
                          <FileText className="w-4 h-4" />
                          {caseData.court === 'High Court' &&
                            caseData.judgmentType === 'JUDGMENT' &&
                            loadingUrls[caseData.id] ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            "View PDF"
                          )}
                        </a>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">
            {selectedCases.length} case{selectedCases.length !== 1 ? 's' : ''} selected
          </span>
          {selectedCases.length > 0 && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              Ready to create
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBackToSearch}
            className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Back to Search
          </button>
          <button
            onClick={onCreateCases}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            disabled={selectedCases.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Create {selectedCases.length > 1 ? 'Cases' : 'Case'}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
} 