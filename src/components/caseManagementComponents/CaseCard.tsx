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
        className="flex justify-between items-center p-4 cursor-pointer hover:bg-background-dark transition-colors"
        onClick={() => router.push(`/case-details/${caseItem.caseDetails.id}`)}
      >
        <div className="flex items-center gap-2 flex-1">
          {/* Court Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-info-light rounded-lg flex items-center justify-center">
              <span className="text-info font-semibold text-sm">
                {index + 1}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text">
                {caseItem.caseDetails.court}
              </span>
              <span className="text-muted">•</span>
              <span className="text-text-light font-medium">
                Diary: {caseItem.caseDetails.diaryNumber}
              </span>
            </div>
          </div>

          {/* Court Information */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {caseItem.caseDetails.caseType && (
                <span className="px-2 py-1 bg-info-light text-info text-xs font-medium rounded">
                  {caseItem.caseDetails.caseType}
                </span>
              )}
            </div>
          </div>

          {/* Judgment Information */}
          <div className="flex items-center gap-4">
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

          {/* Parties Information */}
          <div className="flex-1 min-w-0">
            {caseItem.caseDetails.parties && (
              <div className="truncate">
                <span className="text-gray-500 text-sm">Parties:</span>
                <span className="text-gray-700 text-sm font-medium ml-1">
                  {caseItem.caseDetails.parties}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4">
          {caseItem.caseDetails.site_sync == 0 ? (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
              Sync Pending </span>
          ) : caseItem.caseDetails.site_sync == 1 ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
              Synced </span>
          ) : (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
              Error Syncing </span>
          )}
        </div>

        {/* Navigation Indicator */}
        <div className="flex items-center gap-3 ml-4">
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
} 