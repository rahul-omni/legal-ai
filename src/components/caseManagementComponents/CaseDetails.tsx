import { Calendar, FileText, Loader2 } from "lucide-react";
import { CaseData } from "./types";

interface CaseDetailsProps {
  caseItem: CaseData;
  caseDetails: CaseData[];
  isLoading: boolean;
  handlePdfClick: (caseData: CaseData, event: React.MouseEvent) => void;
}

export function CaseDetails({ caseItem, caseDetails, isLoading, handlePdfClick }: CaseDetailsProps) {
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 bg-background-light rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-6 h-6 text-muted animate-spin" />
        </div>
        <p className="text-muted text-sm">Loading case details...</p>
      </div>
    );
  }

  if (!caseDetails || caseDetails.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted text-sm">Failed to load details</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-dark">
              Case Details
            </h3>
            <p className="text-sm text-text-light">
              Diary Number: {caseItem.diaryNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-success-light text-success-dark text-xs font-medium rounded-full">
            {caseDetails.length} judgment{caseDetails.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {caseDetails.map((detail, idx) => (
          <div key={`${detail.id}-${idx}`} className="bg-background-light rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-info-light rounded-full flex items-center justify-center">
                    <span className="text-info font-semibold text-sm">
                      {idx + 1}
                    </span>
                  </div>
                  <h4 className="font-semibold text-text-dark">
                    {detail.judgmentType ? 
                      (detail.judgmentType === 'JUDGEMENT' ? 'Judgement' : 
                       detail.judgmentType === 'ORDER' ? 'Order' : 
                       detail.judgmentType) : 
                      `Judgment ${idx + 1}`}
                  </h4>
                </div>
                {detail.judgmentDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted" />
                    <span className="text-sm text-text-light font-medium">
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
                  <h5 className="text-sm font-semibold text-text-light uppercase tracking-wide">
                    Case Information
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-text-light">Court</span>
                      <span className="text-sm font-semibold text-text-dark">{detail.court}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-text-light">Case Number</span>
                      <span className="text-sm font-semibold text-text-dark">{detail.caseNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-text-light">City/District</span>
                      <span className="text-sm font-semibold text-text-dark">
                        {detail.city || detail.district || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parties & Advocates */}
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold text-text-light uppercase tracking-wide">
                    Parties & Advocates
                  </h5>
                  <div className="space-y-3">
                    <div className="py-2 border-b border-border">
                      <span className="text-sm text-text-light block mb-1">Parties</span>
                      <span className="text-sm font-semibold text-text-dark">
                        {detail.parties || 'Not specified'}
                      </span>
                    </div>
                    <div className="py-2 border-b border-border">
                      <span className="text-sm text-text-light block mb-1">Advocates</span>
                      <span className="text-sm font-semibold text-text-dark">
                        {detail.advocates || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bench & Actions */}
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold text-text-light uppercase tracking-wide">
                    Bench & Actions
                  </h5>
                  <div className="space-y-3">
                    <div className="py-2 border-b border-border">
                      <span className="text-sm text-text-light block mb-1">Bench</span>
                      <span className="text-sm font-semibold text-text-dark">{detail.bench}</span>
                    </div>
                    {detail.judgmentUrl && !(detail.court === 'High Court' && detail.judgmentType === 'ORDER') && (
                      <div className="pt-2">
                        <a
                          href={Array.isArray(detail.judgmentUrl) ? detail.judgmentUrl[0] : detail.judgmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors border border-info/20"
                          onClick={(e) => {
                            if (detail.court === 'High Court' && 
                              detail.judgmentType === 'JUDGEMENT' &&
                              detail.file_path) {
                              handlePdfClick(detail, e);
                            }
                          }}
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
  );
} 