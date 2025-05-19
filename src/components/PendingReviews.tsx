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

  // const [previewDocument, setPreviewDocument] = useState<ReviewItem | null>(
  //   null
  // );
  const [previewDocument, setPreviewDocument] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);

  useEffect(() => {
    fetchPendingReviews();
  }, [filter]);

  useEffect(() => {}, [isLoading]);

  const fetchPendingReviews = async () => {
    try {
      setIsLoading(true);

      // This will be replaced with an actual API call
      // For now, we'll use mock data

      // Add a small delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Filter reviews based on selected filter
      // const filteredReviews =
      //   filter === "all"
      //     ? allMockReviews
      //     : allMockReviews.filter((review) => review.status === filter);

      // setReviews(filteredReviews);
    } catch (error) {
      handleApiError(error, showToast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDocument = (documentId: string) => {
    // Navigate to the editor with the selected document
    router.push(`/?documentId=${documentId}`);
  };

  const handleOpenPreview = (review) => {
    console.log("Opening preview with data:", review);
    setPreviewDocument(review);
    setShowPreview(true);
  };
  const handleOpenPreview1 = (reviewId: string) => {
    const reviewToPreview = pendingReviews.find(
      (review) => review.id === reviewId
    );
    if (reviewToPreview) {
      setPreviewDocument(reviewToPreview);
      setShowPreview(true);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewDocument(null);
  };

  console.log("reviewdocument:", previewDocument);

  const getFileReviewDetails = async () => {
    try {
      console.log(
        "API route used:",
        apiRouteConfig.privateRoutes.fileReviewReq
      );

      const response = await apiClient.get(
        apiRouteConfig.privateRoutes.fileReviewReq
      );
      // Handle non-200 responses
      if (response.status !== 200) {
        throw new Error(response.data?.error || "Failed to fetch reviews");
      }

      console.log("File review details data:", response.data);
      return response.data || [];
    } catch (error: any) {
      console.error("Error fetching file review details:", error);
      showToast("Error fetching file review details");
      return []; // fallback to empty
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getFileReviewDetails();
        if (!data || data.length === 0) {
          showToast("No pending reviews found");
        }
        setPendingReviews(data);
      } catch (error) {
        console.error("Failed to load reviews:", error);
      }
    };

    fetchReviews();
  }, []);

  console.log("Pending reviews (after state update):", pendingReviews);

  const handleApproveReview = async (reviewId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call

      showToast(`Approved review: ${reviewId}`);

      // Update local state
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId ? { ...review, status: "approved" } : review
        )
      );
    } catch (error) {
      handleApiError(error, showToast);
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call

      // Prompt for comments
      const userComments = window.prompt(
        "Please provide a reason for rejection:"
      );
      // Convert null to undefined to match our type
      const comments = userComments === null ? undefined : userComments;

      showToast(`Rejected review: ${reviewId}`);

      // Update local state
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId
            ? { ...review, status: "rejected", comments }
            : review
        )
      );
    } catch (error) {
      handleApiError(error, showToast);
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
                  console.log("Review item:", review);

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
                        {formatDate(review.requester.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            review.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : review.status === "approved"
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
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
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
                                onClick={() =>
                                  handleRejectReview(review.file.id)
                                }
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

      {/* {previewDocument && (
        <Modal
          isOpen={showPreview}
          onClose={handleClosePreview}
          title={previewDocument.file?.name}
          size="full"
          footer={
            <ModalFooter>
              <div>
                <p className="text-sm text-gray-600">
                  Sent by:{" "}
                  <span className="font-medium">
                    {previewDocument.requester.name}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Status:{" "}
                  <span
                    className={`font-medium ${
                      previewDocument.status === "pending"
                        ? "text-yellow-600"
                        : previewDocument.status === "approved"
                          ? "text-green-600"
                          : "text-red-600"
                    }`}
                  >
                    {previewDocument.status.charAt(0).toUpperCase() +
                      previewDocument.status.slice(1)}
                  </span>
                </p>
              </div>

              {previewDocument.status === "pending" && (
                <div className="flex space-x-2">
                  <ModalButton
                    type="button"
                    variant="primary"
                    onClick={() => {
                      handleApproveReview(previewDocument.id);
                      handleClosePreview();
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </ModalButton>
                  <ModalButton
                    type="button"
                    variant="danger"
                    onClick={() => {
                      handleRejectReview(previewDocument.id);
                      handleClosePreview();
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </ModalButton>
                </div>
              )}
            </ModalFooter>
          }
        >
          <iframe
            src={previewDocument.documentUrl}
            className="w-full h-full border-0"
            title={previewDocument.documentName}
            allowFullScreen
          />
        </Modal>
      )} */}

      {previewDocument &&
        (console.log("Current preview document:", previewDocument), // <-- Se
        (
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
                        previewDocument.status === "pending"
                          ? "text-yellow-600"
                          : previewDocument.status === "approved"
                            ? "text-green-600"
                            : "text-red-600"
                      }`}
                    >
                      {previewDocument.status?.charAt(0).toUpperCase() +
                        previewDocument.status?.slice(1) || "Pending"}
                    </span>
                  </p>
                </div>

                {previewDocument.status === "pending" && (
                  <div className="flex space-x-2">
                    <ModalButton
                      type="button"
                      variant="primary"
                      onClick={() => {
                        handleApproveReview(previewDocument.id);
                        handleClosePreview();
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </ModalButton>
                    <ModalButton
                      type="button"
                      variant="danger"
                      onClick={() => {
                        handleRejectReview(previewDocument.id);
                        handleClosePreview();
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </ModalButton>
                  </div>
                )}
              </ModalFooter>
            }
          >
            {/* {previewDocument.file?.content ? (
      <iframe
        src={previewDocument.file.content}
        className="w-full h-full border-0"
        title={previewDocument.file.name}
        allowFullScreen
      />
    ) : (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No document content available</p>
      </div>
    )} */}
            <div className="p-4 h-full">
              {previewDocument.file?.content ? (
                <div className="border rounded-lg h-full p-4 overflow-auto">
                  {previewDocument.file.name.endsWith(".pdf") ? (
                    <iframe
                      src={`data:application/pdf;base64,${btoa(previewDocument.file.content)}`}
                      className="w-full h-full border-0"
                      title={previewDocument.file.name}
                    />
                  ) : (
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: previewDocument.file.content,
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
          </Modal>
        ))}
    </div>
  );
}
