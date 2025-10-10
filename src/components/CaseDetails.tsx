"use client";

import { useEffect, useState } from "react";
import { CaseData } from "./caseManagementComponents/types";
import { Calendar, FileText, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";

export function CaseDetails({ id }: { id: string }) {
    const router = useRouter();
    const [caseItem, setCaseItem] = useState<CaseData | null>(null);
    const [caseDetails, setCaseDetails] = useState<CaseData[]>([]);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

    const getCaseDetailsFromUserCase = async (id: string): Promise<CaseData> => {
        console.log("Fetching case data for ID:", id);
        const response = await fetch(`/api/cases/get-user-cases-by-id?id=${id}`);
        console.log("API response status:", response.status);
        const data = await response.json();
        console.log("API response data:", data);
        console.log("Setting caseItem to:", data);
        setCaseItem(data);
        return data;
    }

    const fetchCaseDetails = async (caseDetailData: CaseData) => {
        if (!caseDetailData?.id) {
          console.error('Cannot fetch details - case item has no ID:', caseDetailData);
          return;
        }
        console.log("Fetching case details for:", caseDetailData);
    
        try {
          setLoadingDetails(true);
    
          const diaryParts = caseDetailData.diaryNumber.split('/');
          const diaryNumber = diaryParts[0];
          const year = diaryParts[1];
    
          let response;
    
          if (caseDetailData.court === "Supreme Court") {
            const searchUrlSC = new URL("/api/cases/search/supremeCourt", window.location.origin);
            searchUrlSC.searchParams.append("diaryNumber", diaryNumber);
            searchUrlSC.searchParams.append("year", year);
            searchUrlSC.searchParams.append("court", caseDetailData.court);
            searchUrlSC.searchParams.append("caseType", 'Diary Number');
    
            if (caseDetailData.judgmentType) {
              searchUrlSC.searchParams.append("judgmentType", caseDetailData.judgmentType);
            }
    
            response = await fetch(searchUrlSC.toString());
            console.log("Supreme Court response:", response);
    
          } else if (caseDetailData.court === "District Court") {
            const searchUrlDC = new URL("/api/cases/search/districtCourt", window.location.origin);
            searchUrlDC.searchParams.append("diaryNumber", diaryNumber);
            searchUrlDC.searchParams.append("year", year);
            searchUrlDC.searchParams.append("court", caseDetailData.court);
    
            if (caseDetailData.caseType) {
              searchUrlDC.searchParams.append("caseType", caseDetailData.caseType);
            }
            if (caseDetailData.district) {
              searchUrlDC.searchParams.append("district", caseDetailData.district);
            }
            if (caseDetailData.courtComplex) {
              searchUrlDC.searchParams.append("courtComplex", caseDetailData.courtComplex);
            }
    
            response = await fetch(searchUrlDC.toString());
          } else if (caseDetailData.court === "NCLT" || caseDetailData.court === "Nclt Court") {
            console.log("Full caseItem for NCLT:", JSON.stringify(caseDetailData, null, 2));
            console.log("caseItem.bench value:", caseDetailData.bench);
      
            const searchUrlNCLT = new URL("/api/cases/search/ncltCourt", window.location.origin);
            searchUrlNCLT.searchParams.append("diaryNumber", diaryNumber);
            searchUrlNCLT.searchParams.append("year", year);
            searchUrlNCLT.searchParams.append("court", caseDetailData.court);
    
            if (caseDetailData.caseType) {
              searchUrlNCLT.searchParams.append("caseType", caseDetailData.caseType);
            }
            if (caseDetailData.bench) {
              searchUrlNCLT.searchParams.append("bench", caseDetailData.bench);
            }
            if (caseDetailData.district) {
              searchUrlNCLT.searchParams.append("district", caseDetailData.district);
            }
    
            response = await fetch(searchUrlNCLT.toString());
          } else {
            const searchUrl = new URL("/api/cases/search", window.location.origin);
            searchUrl.searchParams.append("diaryNumber", diaryNumber);
            searchUrl.searchParams.append("year", year);
            searchUrl.searchParams.append("court", caseDetailData.court);
    
            if (caseDetailData.caseType) {
              searchUrl.searchParams.append("caseType", caseDetailData.caseType);
            }
            if (caseDetailData.city) {
              searchUrl.searchParams.append("city", caseDetailData.city);
            }
            if (caseDetailData.bench) {
              searchUrl.searchParams.append("bench", caseDetailData.bench);
            }
           
            response = await fetch(searchUrl.toString());
          }
    
          const data = await response.json();
    
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
    
            setCaseDetails(sortedCases);
            console.log("Sorted cases:", sortedCases);
    
          } else {
            throw new Error(data.message || 'No case data returned from search');
          }
        } catch (error) {
          console.error('Search error:', error);
          setCaseDetails([caseDetailData]);
        } finally {
          setLoadingDetails(false);
        }
      };

    useEffect(() => {
        if (id) {
            console.log("Starting to fetch case details for ID:", id);
            getCaseDetailsFromUserCase(id).then((caseData) => {
                console.log("Received caseData from API:", caseData);
                if (caseData && caseData.id) {
                    console.log("Calling fetchCaseDetails with:", caseData);
                    fetchCaseDetails(caseData);
                } else {
                    console.error("No valid caseData received:", caseData);
                }
            }).catch((error) => {
                console.error("Error fetching case data:", error);
            });
        }
    }, [id]);

  
  if (loadingDetails) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 bg-background-light rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-6 h-6 text-muted animate-spin" />
        </div>
        <p className="text-muted text-sm">Loading case details...</p>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted text-sm">Case not found</p>
      </div>
    );
  }

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
                Diary Number: {caseItem.diaryNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Case Details Content */}
      <div className="p-6">
        {caseDetails.length > 0 ? (
          <div className="space-y-6">
            {/* Case Information Card - Show once */}
            <div className="bg-background-light rounded-lg border border-border shadow-sm">
              <div className="px-6 py-4 border-b border-border bg-background">
                <h3 className="text-lg font-semibold text-text-dark">Case Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Basic Case Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-text-light">Court</span>
                      <span className="text-sm font-semibold text-text-dark">{caseDetails[0].court}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-text-light">Case Number</span>
                      <span className="text-sm font-semibold text-text-dark">{caseDetails[0].caseNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-text-light">City/District</span>
                      <span className="text-sm font-semibold text-text-dark">
                        {caseDetails[0].city || caseDetails[0].district || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Parties & Advocates */}
                  <div className="space-y-3">
                    <div className="py-2 border-b border-border">
                      <span className="text-sm text-text-light block mb-1">Parties</span>
                      <span className="text-sm font-semibold text-text-dark">
                        {caseDetails[0].parties || 'Not specified'}
                      </span>
                    </div>
                    <div className="py-2 border-b border-border">
                      <span className="text-sm text-text-light block mb-1">Advocates</span>
                      <span className="text-sm font-semibold text-text-dark">
                        {caseDetails[0].advocates || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Bench */}
                  <div className="space-y-3">
                    <div className="py-2 border-b border-border">
                      <span className="text-sm text-text-light block mb-1">Bench</span>
                      <span className="text-sm font-semibold text-text-dark">{caseDetails[0].bench || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Judgments Section */}
            <div className="space-y-4">
              <div className="flex flex-row max-w-2xl mx-auto items-center justify-between">
                <h2 className="text-lg font-semibold text-text-dark">
                  Judgment Details
                </h2>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-success-light text-success-dark text-xs font-medium rounded-full">
                    {caseDetails.length} judgment{caseDetails.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Judgment Cards - Vertical list, centered */}
              <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto">
                {caseDetails.map((detail, idx) => (
                  <div key={`${detail.id}-${idx}`} className="bg-background-light rounded-lg border border-border shadow-sm overflow-hidden w-full">
                    {/* Mobile: Centered header */}
                    <div className="px-6 py-4 border-b border-border bg-background md:hidden">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-info-light rounded-full flex items-center justify-center">
                            <span className="text-info font-semibold text-sm">
                              {idx + 1}
                            </span>
                          </div>
                          <h4 className="font-semibold text-text-dark">
                            {
                              `Order`}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Desktop: Inline layout */}
                    <div className="hidden md:flex flex-row items-center justify-between px-6 py-4 border-b border-border bg-background">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-info-light rounded-full flex items-center justify-center">
                          <span className="text-info font-semibold text-sm">
                            {idx + 1}
                          </span>
                        </div>
                        <h4 className="font-semibold text-text-dark">
                          {
                            `Order`}
                        </h4>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Judgment Date */}
                        {detail.judgmentDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-muted" />
                            <span className="text-base text-text-light font-medium">
                              {detail.judgmentDate}
                            </span>
                          </div>
                        )}

                        {/* PDF Link */}
                        {detail.judgmentUrl && (
                          <Button
                            variant="secondary"
                            size="md"
                            icon={<FileText className="w-5 h-5" />}
                            onClick={() => {
                              const url = Array.isArray(detail.judgmentUrl) ? detail.judgmentUrl[0] : detail.judgmentUrl;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            View PDF
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Mobile: Content below */}
                    <div className="flex flex-row justify-between p-6 md:hidden">
                      {/* Judgment Date */}
                      {detail.judgmentDate && (
                        <div className="flex items-center justify-center gap-2">
                          <Calendar className="w-5 h-5 text-muted" />
                          <span className="text-base text-text-light font-medium">
                            {detail.judgmentDate}
                          </span>
                        </div>
                      )}

                      {/* PDF Link */}
                      {detail.judgmentUrl && (
                        <div className="flex justify-center items-center">
                          <Button
                            variant="secondary"
                            size="md"
                            icon={<FileText className="w-5 h-5" />}
                            onClick={() => {
                              const url = Array.isArray(detail.judgmentUrl) ? detail.judgmentUrl[0] : detail.judgmentUrl;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            View PDF
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted text-sm">No detailed judgments found for this case</p>
          </div>
        )}
      </div>
    </div>
  );
}
