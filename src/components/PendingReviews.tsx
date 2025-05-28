import { handleApiError } from "@/helper/handleApiError";
import { CheckCircle, Clock, FileText, User, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal } from "./ui/Modal";
import { ModalButton, ModalFooter } from "./ui/ModalButton";
import { useToast } from "./ui/toast";
import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import { apiClient } from "@/app/apiServices";
import DOMPurify from "dompurify";
import toast from "react-hot-toast";
import "../app/globals.css";
import PdfViewer from "./PdfViewer";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import PDFTextViewer from "./PDFTextViewer";

interface ReviewItem {
  id: string;
  documentId: string;
  documentName: string;
  documentType: "pdf" | "docx";
  documentUrl?: string;
  senderId: string;
  senderName: string;
  sentAt: string;
  status: "pending" | "approved" | "rejected";
  dueDate?: string;
  comments?: string;
}

export function PendingReviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentReviewId, setCurrentReviewId] = useState("");
  const [pdfLoading, setPdfLoading] = useState(true);
  GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

  useEffect(() => {
    fetchPendingReviews();
  }, [filter]);

  const fetchPendingReviews = async () => {
    try {
      setIsLoading(true);
      const data = await getFileReviewDetails();
      if (!data || data.length === 0) {
        showToast("No pending reviews found");
      }
      setPendingReviews(data);
    } catch (error) {
      handleApiError(error, showToast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDocument = (documentId: string) => {
    alert("This feature is not implemented yet.");
    console.log("Opening document with ID:", documentId);

    router.push(`/?documentId=${documentId}`);
  };

  // const handleOpenPreview = (review: any) => {
  //     console.log("File Content Preview:", review.file.content?.slice(0, 100));
  //   setPreviewDocument(review);
  //   setShowPreview(true);
  // };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      let fullHtml = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item: any) => item.str).join(" ");
        fullHtml += `<p><strong>Page ${i}:</strong><br>${text.replace(/\n/g, "<br>")}</p>`;
      }

      return fullHtml;
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      throw error;
    }
  };

  const handleOpenPreview = async (review: any) => {
    const fileName = review.file.name.toLowerCase();
    const isPDF = fileName.endsWith(".pdf");

    try {
      let previewContent = {
        ...review,
        file: {
          ...review.file,
          type: isPDF ? "pdf" : "docx",
          content: review.file.content,
        },
      };

      if (isPDF) {
        const original = review.file.originalContent;
        let pdfContent = "";

        if (typeof original === "string") {
          if (original.startsWith("data:application/pdf")) {
            pdfContent = original;
          } else if (/^[A-Za-z0-9+/]+={0,2}$/.test(original)) {
            // Ensure proper base64 data URI format
            pdfContent = `data:application/pdf;base64,${original}`;
          } else if (original.startsWith("http") || original.startsWith("/")) {
            pdfContent = encodeURI(original);
          } else if (original.startsWith("%PDF-")) {
            // Raw PDF data
            pdfContent = original;
          }
        }

        previewContent.file.content = pdfContent || review.file.content;
        previewContent.file.type = pdfContent ? "pdf" : "pdf-text";
      }

      setPreviewDocument(previewContent);
      setShowPreview(true);
    } catch (error) {
      console.error("Error opening preview:", error);
      showToast(
        `Failed to open document: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  // working
  const handleOpenPreview1 = async (review: any) => {
    const fileName = review.file.name;
    const isPDF = fileName.toLowerCase().endsWith(".pdf");

    try {
      if (isPDF) {
        // First check if we have original PDF content
        if (review.file.originalContent) {
          // Handle original PDF content
          let pdfContent = review.file.originalContent;

          if (
            typeof pdfContent === "string" &&
            pdfContent.startsWith("data:application/pdf")
          ) {
            setPreviewDocument({
              ...review,
              file: {
                ...review.file,
                content: pdfContent,
                type: "pdf",
              },
            });
          } else if (
            typeof pdfContent === "string" &&
            /^[A-Za-z0-9+/]+={0,2}$/.test(pdfContent)
          ) {
            const dataUrl = `data:application/pdf;base64,${pdfContent}`;
            setPreviewDocument({
              ...review,
              file: {
                ...review.file,
                content: dataUrl,
                type: "pdf",
              },
            });
          } else if (
            typeof pdfContent === "string" &&
            (pdfContent.startsWith("http") || pdfContent.startsWith("/"))
          ) {
            setPreviewDocument({
              ...review,
              file: {
                ...review.file,
                content: pdfContent,
                type: "pdf",
              },
            });
          }
        }

        // If no original PDF content, fall back to extracted text
        if (!review.file.originalContent && review.file.content) {
          setPreviewDocument({
            ...review,
            file: {
              ...review.file,
              type: "pdf-text", // Special type for extracted text
              content: review.file.content,
            },
          });
        }
      } else {
        // Handle non-PDF files (DOCX)
        setPreviewDocument({
          ...review,
          file: {
            ...review.file,
            type: "docx",
            content: review.file.content,
          },
        });
      }
      setShowPreview(true);
    } catch (error) {
      console.error("Error opening preview:", error);
      showToast(`Failed to open document: ${(error as Error).message}`);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewDocument(null);
  };

  const getFileReviewDetails = async () => {
    try {
      const response = await apiClient.get(
        apiRouteConfig.privateRoutes.fileReviewReq
      );
      if (response.status !== 200) {
        throw new Error(response.data?.error || "Failed to fetch reviews");
      }
      return response.data || [];
    } catch (error: any) {
      console.error("Error fetching file review details:", error);
      showToast("Error fetching file review details");
      return [];
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      // Optimistic update
      setPendingReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId ? { ...review, status: "COMPLETED" } : review
        )
      );

      // Use the correct API endpoint from your config
      const response = await apiClient.put(
        apiRouteConfig.privateRoutes.reviewStatus(reviewId),
        { status: "COMPLETED" } // Make sure this matches your backend enum
      );

      if (response.status !== 200) {
        throw new Error("Failed to approve review");
      }

      showToast("Review approved successfully");
    } catch (error) {
      // Revert optimistic update on error
      setPendingReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId ? { ...review, status: "PENDING" } : review
        )
      );
      handleApiError(error, showToast);
    } finally {
      handleClosePreview();
    }
  };

  const openRejectModal = (reviewId: string) => {
    setCurrentReviewId(reviewId);
    setShowRejectModal(true);
  };

  // Update the handleRejectReview function
  const handleRejectReview = async () => {
    if (!rejectComment) {
      showToast("Please provide a reason for rejection");
      return;
    }

    try {
      // Optimistic update (status only first)
      setPendingReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === currentReviewId
            ? { ...review, status: "DECLINED" }
            : review
        )
      );

      // First update status
      const statusResponse = await apiClient.put(
        `${apiRouteConfig.privateRoutes.fileReviewReq}/${currentReviewId}/status`,
        { status: "DECLINED" }
      );

      if (statusResponse.status !== 200) {
        throw new Error("Status update failed");
      }

      // Then add comment (with optimistic update)
      const tempComment = {
        id: `temp-${Date.now()}`,
        content: rejectComment,
        createdAt: new Date().toISOString(),
      };

      setPendingReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === currentReviewId
            ? {
                ...review,
                fileReviewComments: [
                  ...(review.fileReviewComments || []),
                  tempComment,
                ],
              }
            : review
        )
      );

      const commentResponse = await apiClient.post(
        `${apiRouteConfig.privateRoutes.fileReviewReq}/${currentReviewId}/comments`,
        { content: rejectComment }
      );

      if (commentResponse.status !== 201) {
        throw new Error("Comment failed");
      }

      // Final update with real comment
      setPendingReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === currentReviewId
            ? {
                ...review,
                fileReviewComments: [
                  ...(review.fileReviewComments?.filter(
                    (c) => c.id !== tempComment.id
                  ) || []),
                  commentResponse.data,
                ],
              }
            : review
        )
      );

      toast.success("Review rejected successfully");
    } catch (error) {
      // Revert both changes on error
      setPendingReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === currentReviewId
            ? {
                ...review,
                status: "PENDING",
                fileReviewComments: review.fileReviewComments?.filter(
                  (c) => !c.id?.startsWith("temp-")
                ),
              }
            : review
        )
      );
      handleApiError(error, showToast);
    } finally {
      setShowRejectModal(false);
      setRejectComment("");
      handleClosePreview();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysRemaining = (dueDate?: string) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Pending Reviews</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : pendingReviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No reviews found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Document
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Sent By
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date Received
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Due Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(pendingReviews) && pendingReviews.length > 0 ? (
                pendingReviews.map((review) => {
                  const daysRemaining = getDaysRemaining(review.dueDate);
                  console.log("Review Data:", pendingReviews);
                  
                  return (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="flex-shrink-0 h-5 w-5 text-gray-400" />
                          <div className="ml-3">
                            <div
                              className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                              onClick={() => handleOpenPreview(review)}
                            >
                              {review.file.name}
                            </div>

                            {review.comments && (
                              <div className="text-xs text-gray-500 mt-1">
                                <span className="font-medium">Comments:</span>{" "}
                                {review.comments}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="flex-shrink-0 h-5 w-5 text-gray-400" />
                          <div className="ml-3">
                            <div className="text-sm text-gray-900">
                              {review.requester.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(review.createdAt)} 
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            review.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : review.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {review.status.charAt(0).toUpperCase() +
                            review.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {review.dueDate ? (
                          <div className="flex items-center">
                            <Clock className="flex-shrink-0 h-5 w-5 text-gray-400" />
                            <div className="ml-3">
                              <div className="text-sm text-gray-900">
                                {formatDate(review.dueDate)}
                              </div>
                              {daysRemaining !== null &&
                                review.status === "pending" && (
                                  <div
                                    className={`text-xs ${
                                      daysRemaining < 0
                                        ? "text-red-600"
                                        : daysRemaining <= 1
                                          ? "text-orange-600"
                                          : "text-green-600"
                                    }`}
                                  >
                                    {daysRemaining < 0
                                      ? `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? "s" : ""}`
                                      : daysRemaining === 0
                                        ? "Due today"
                                        : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`}
                                  </div>
                                )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            No deadline
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenDocument(review.id)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors duration-100"
                          >
                            Review
                          </button>
                          {review.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApproveReview(review.id)}
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openRejectModal(review.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <p className="text-gray-500">No records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}

      {previewDocument && (
        <Modal
          isOpen={showPreview}
          onClose={handleClosePreview}
          title={previewDocument.file?.name || "Document Preview"}
          size="full"
          footer={
            <ModalFooter>
              <div>
                <p className="text-sm text-gray-600">
                  Sent by:{" "}
                  <span className="font-medium">
                    {previewDocument.requester?.name || "Unknown"}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Status:{" "}
                  <span
                    className={`font-medium ${
                      previewDocument.status === "PENDING"
                        ? "text-yellow-600"
                        : previewDocument.status === "COMPLETED"
                          ? "text-green-600"
                          : "text-red-600"
                    }`}
                  >
                    {previewDocument.status?.charAt(0).toUpperCase() +
                      previewDocument.status?.slice(1).toLowerCase() ||
                      "Pending"}
                  </span>
                </p>
              </div>

              {previewDocument.status === "PENDING" && (
                <div className="flex space-x-2">
                  <ModalButton
                    type="button"
                    variant="primary"
                    onClick={() => handleApproveReview(previewDocument.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </ModalButton>
                  <ModalButton
                    type="button"
                    variant="danger"
                    onClick={() => openRejectModal(previewDocument.id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </ModalButton>
                </div>
              )}
            </ModalFooter>
          }
        >
          <div className="p-4 h-full bg-white">
            {previewDocument.file ? (
              <div className="border rounded-lg h-full p-4 overflow-auto bg-white">
                {previewDocument.file.name?.endsWith(".pdf") ? (
                  <div className="h-full flex flex-col">
                    <div className="flex-grow overflow-auto bg-white p-4">
                      {previewDocument.file.content ? (
                        <div className="h-full p-4 overflow-auto">
                          {previewDocument.file.type === "pdf" ? (
                            <PdfViewer content={previewDocument.file.content} />
                          ) : previewDocument.file.type === "pdf-text" ? (
                            <PDFTextViewer
                              content={previewDocument.file.content}
                            />
                          ) : (
                            <div
                              className="prose max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(
                                  previewDocument.file.content
                                ),
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p>No content available</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : previewDocument.file.name?.endsWith(".docx") ? (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        previewDocument.file.content || ""
                      ),
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FileText className="h-12 w-12 text-gray-400 mb-4" />
                    <p>Preview not available for this file type</p>
                    {previewDocument.file.content && (
                      <a
                        href={`data:text/plain;base64,${btoa(previewDocument.file.content)}`}
                        download={previewDocument.file.name}
                        className="mt-4 text-blue-600 hover:underline"
                      >
                        Download File
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : previewDocument.file?.url ? (
              <iframe
                src={previewDocument.file.url}
                className="w-full h-full border-0"
                title={previewDocument.file.name}
                onError={() => showToast("Failed to load document from URL")}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-white">
                <p>No content available</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject Comment Modal 
      // Update the Modal footer in the reject confirmation modal
      */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Review"
        footer={
          <ModalFooter>
            <ModalButton
              type="button"
              variant="secondary"
              onClick={() => setShowRejectModal(false)}
              disabled={isLoading}
            >
              Cancel
            </ModalButton>
            <ModalButton
              type="button"
              variant="danger"
              onClick={handleRejectReview}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Reject
                </>
              )}
            </ModalButton>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please provide a reason for rejecting this review:
          </p>
          <textarea
            className="w-full h-32 p-2 border border-gray-300 rounded-md"
            placeholder="Enter rejection reason..."
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </Modal>
    </div>
  );
}
