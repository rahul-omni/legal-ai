"use client";

import { useEffect, useState } from "react";
import { Calendar, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";

type JudgmentOrder = {
  gcsPath: string;
  filename: string;
  judgmentDate: string;
};

type CaseData = {
  id: string;
  diaryNumber: string;
  caseNumber?: string;
  parties?: string | null;
  advocates?: string | null;
  bench?: string | null;
  judgmentBy?: string | null;
  judgmentDate?: string | null;
  court?: string;
  date?: string;
  judgmentUrl?: {
    orders?: JudgmentOrder[];
  };
  city?: string;
  district?: string;
  courtComplex?: string;
  courtType?: string;
  site_sync?: number;
};

export function CaseDetails({ id }: { id: string }) {
  const router = useRouter();
  const [caseItem, setCaseItem] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const getCaseDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cases/get-user-cases-by-id?id=${id}`);
      if (!response.ok) throw new Error("Failed to fetch case details");
      const data = await response.json();
      setCaseItem(data);
    } catch (error) {
      console.error("Error fetching case details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) getCaseDetails(id);
  }, [id]);

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="p-6 bg-background border-b border-border">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-text-dark">
                Case Details
              </h1>
              <p className="text-sm text-text-light">
                Diary Number: {caseItem?.diaryNumber || (loading ? "Loading..." : "N/A")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-background-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-6 h-6 text-muted animate-spin" />
            </div>
            <p className="text-muted text-sm">Loading case details...</p>
          </div>
        ) : !caseItem ? (
          <div className="text-center py-12">
            <p className="text-muted text-sm">Case not found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Case Information Card */}
            <div className="bg-background-light rounded-lg border border-border shadow-sm">
              <div className="px-6 py-4 border-b border-border bg-background-light">
                <h3 className="text-lg font-semibold text-text-dark">Case Information</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <InfoRow label="Court" value={caseItem.court || "N/A"} />
                  <InfoRow label="Case Number" value={caseItem.caseNumber || "N/A"} />
                  <InfoRow
                    label="City/District"
                    value={caseItem.city || caseItem.district || "N/A"}
                  />
                </div>

                <div className="space-y-3">
                  <InfoRow label="Parties" value={caseItem.parties || "Not specified"} />
                  <InfoRow label="Advocates" value={caseItem.advocates || "N/A"} />
                  <InfoRow
                    label="Sync status"
                    value={caseItem.site_sync == 0 ? "Pending" : caseItem.site_sync == 1 ?
                       "Synced" : "Error syncing"}
                  />
                </div>

                <div className="space-y-3">
                  <InfoRow label="Bench" value={caseItem.bench || "N/A"} />
                  <InfoRow label="Judgment By" value={caseItem.judgmentBy || "N/A"} />
                </div>
              </div>
            </div>

            {/* Judgment Orders Section */}
            <div className="space-y-4">
              <div className="flex flex-row max-w-2xl mx-auto items-center justify-between">
                <h2 className="text-lg font-semibold text-text-dark">
                  Judgment Details
                </h2>
                <span className="px-3 py-1 bg-success-light text-success-dark text-xs font-medium rounded-full">
                  {caseItem.judgmentUrl?.orders?.length || 0} Order
                  {caseItem.judgmentUrl?.orders?.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto">
                {caseItem.judgmentUrl?.orders?.length ? (
                  caseItem.judgmentUrl.orders.map((order, idx) => (
                    <div
                      key={order.gcsPath}
                      className="bg-background-light rounded-lg border border-border shadow-sm overflow-hidden w-full"
                    >
                      <div className="hidden md:flex flex-row items-center justify-between px-6 py-4 border-b border-border bg-background-light">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-info-light rounded-full flex items-center justify-center">
                            <span className="text-info font-semibold text-sm">
                              {idx + 1}
                            </span>
                          </div>
                          <h4 className="font-semibold text-text-dark">Order</h4>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-muted" />
                            <span className="text-base text-text-light font-medium">
                              {order.judgmentDate}
                            </span>
                          </div>

                          <Button
                            variant="secondary"
                            size="md"
                            icon={<FileText className="w-5 h-5" />}
                            onClick={async () => {
                              const signedUrl = caseItem.court == 'High Court' ? await generateSignedUrlForCase(order.filename || '') : order.gcsPath;

                              window.open(signedUrl, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            View PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-sm py-4">No judgments found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border">
      <span className="text-sm text-text-light">{label}</span>
      <span className={`text-sm font-semibold ${value == 'Pending' ? 'text-yellow-500' : value == 'Error syncing' ? 'text-red-500' : value == 'Synced' ? 'text-green-500' : 'text-dark'}`}>
        {value}
        {value == 'Error syncing' && <span className="text-xs">(Could not find this case)</span>}
      </span>
    </div>
  );
}
