import { Calendar, ArrowRight } from "lucide-react";
import { CaseData } from "./types";
import { useRouter } from "next/navigation";

interface CaseCardProps {
  caseItem: CaseData;
  index: number;
}

export function CaseCard({
  caseItem,
  index
}: CaseCardProps) {
  if (!caseItem.caseDetails.id) {
    console.error('Rendering case with no ID:', caseItem);
    return null;
  }

  const router = useRouter();
  return (
    <div className="bg-background-light border border-border rounded-lg hover:shadow-md transition-all duration-200 text-sm">
      {/* Case header - clickable */}
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 p-4 cursor-pointer hover:bg-background-dark transition-colors"
        onClick={() => router.push(`/case-details/${caseItem.caseDetails.id}`)}
      >
        {/* Left side - Main content */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
            {/* Court Badge */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 bg-info-light rounded-lg flex items-center justify-center">
                <span className="text-info font-semibold text-sm">
                  {index + 1}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-text">
                  {caseItem.caseDetails.court}
                </span>
                <span className="text-muted">•</span>
                <span className="text-text-light font-medium">
                  {`${caseItem.caseDetails.diaryNumber ? "Diary" : "Case"} Number`}: {caseItem.caseDetails.diaryNumber || caseItem.caseDetails.caseNumber || ''}
                </span>
              </div>
            </div>

            {/* Court Information */}
            {caseItem.caseDetails.caseType && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-2 py-1 bg-info-light text-info text-xs font-medium rounded">
                  {caseItem.caseDetails.caseType}
                </span>
              </div>
            )}

            {/* Judgment Information */}
            {(caseItem.caseDetails.judgmentDate || caseItem.caseDetails.judgmentBy) && (
              <div className="flex items-center gap-4 flex-wrap flex-shrink-0">
                {caseItem.caseDetails.judgmentDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 text-sm">
                      {caseItem.caseDetails.judgmentDate}
                    </span>
                  </div>
                )}
                {caseItem.caseDetails.judgmentBy && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">By:</span>
                    <span className="text-gray-700 text-sm font-medium">
                      {caseItem.caseDetails.judgmentBy}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Parties Information */}
            {caseItem.caseDetails.parties && (() => {
              const partiesText = caseItem.caseDetails.parties;
              const truncatedText = partiesText.length > 20 
                ? partiesText.substring(0, 20) + "......"
                : partiesText;
              
              return (
                <div className="flex-shrink-0 min-w-0 max-w-full sm:max-w-xs">
                  <div className="truncate">
                    <span className="text-gray-500 text-sm">Parties:</span>
                    <span 
                      className="text-gray-700 text-sm font-medium ml-1"
                      title={partiesText}
                    >
                      {truncatedText}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right side - Status and Navigation */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-auto sm:ml-4">
          {caseItem.caseDetails.site_sync == 0 ? (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded whitespace-nowrap">
              Sync Pending </span>
          ) : caseItem.caseDetails.site_sync == 1 ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded whitespace-nowrap">
              Synced </span>
          ) : (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded whitespace-nowrap">
              Error Syncing </span>
          )}
          <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
} 