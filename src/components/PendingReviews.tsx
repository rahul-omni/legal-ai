import { handleApiError } from "@/helper/handleApiError";
import { CheckCircle, Clock, FileText, User, X, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "./ui/toast";

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

  const [previewDocument, setPreviewDocument] = useState<ReviewItem | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    console.log("PendingReviews component mounted");
    fetchPendingReviews();
  }, [filter]);

  useEffect(() => {
    console.log("isLoading state changed:", isLoading);
  }, [isLoading]);

  const fetchPendingReviews = async () => {
    console.log("Fetching pending reviews...");
    try {
      setIsLoading(true);

      // This will be replaced with an actual API call
      // For now, we'll use mock data
      const allMockReviews: ReviewItem[] = [
        {
          id: "rev1",
          documentId: "doc1",
          documentName: "Contract Agreement v2.docx",
          documentType: "docx",
          documentUrl:
            "https://docs.google.com/document/d/13zMJxruaqB_NYpy_5w0Z-R6RVMOR5nfj3ogMSGbfA68/preview",
          senderId: "user1",
          senderName: "John Doe",
          sentAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          status: "pending",
          dueDate: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
        },
        {
          id: "rev2",
          documentId: "doc2",
          documentName: "NDA for Project X.pdf",
          documentType: "pdf",
          documentUrl: "https://www.africau.edu/images/default/sample.pdf",
          senderId: "user2",
          senderName: "Jane Smith",
          sentAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          status: "pending",
          dueDate: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        },
        {
          id: "rev3",
          documentId: "doc3",
          documentName: "Employment Agreement.docx",
          documentType: "docx",
          documentUrl:
            "https://docs.google.com/document/d/1wRvoLiTyhwMSOMiqf1tvsNLF_GQzJYCQXgWJ4Qdg0Hw/preview",
          senderId: "user3",
          senderName: "Robert Johnson",
          sentAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          status: "pending",
        },
        {
          id: "rev4",
          documentId: "doc4",
          documentName: "Lease Agreement.docx",
          documentType: "docx",
          documentUrl:
            "https://docs.google.com/document/d/1Wt_GxmKbQWA_D4CxWorHJ7KjcGCJMUNzZwzUWwL58Qk/preview",
          senderId: "user1",
          senderName: "John Doe",
          sentAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
          status: "approved",
          comments: "Looks good, approved.",
        },
        {
          id: "rev5",
          documentId: "doc5",
          documentName: "Service Contract.pdf",
          documentType: "pdf",
          documentUrl:
            "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          senderId: "user2",
          senderName: "Jane Smith",
          sentAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
          status: "rejected",
          comments: "Needs revision on section 3.",
        },
      ];

      // Add a small delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Filter reviews based on selected filter
      const filteredReviews =
        filter === "all"
          ? allMockReviews
          : allMockReviews.filter((review) => review.status === filter);

      console.log("Reviews fetched:", filteredReviews);
      setReviews(filteredReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      handleApiError(error, showToast);
    } finally {
      console.log("Setting isLoading to false");
      setIsLoading(false);
    }
  };

  const handleOpenDocument = (documentId: string) => {
    // Navigate to the editor with the selected document
    router.push(`/?documentId=${documentId}`);
  };

  const handleOpenPreview = (review: ReviewItem) => {
    setPreviewDocument(review);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewDocument(null);
  };

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

      {/* Debug info */}
      <div className="mb-4 text-sm text-gray-500">
        Loading state: {isLoading ? "Loading..." : "Not loading"}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : reviews.length === 0 ? (
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
              {reviews.map((review) => {
                const daysRemaining = getDaysRemaining(review.dueDate);

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
                            {review.documentName}
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
                            {review.senderName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(review.sentAt)}
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
                          onClick={() => handleOpenDocument(review.documentId)}
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
                              onClick={() => handleRejectReview(review.id)}
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
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Preview Modal */}
      {showPreview && previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-4/5 h-4/5 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                {previewDocument.documentName}
              </h3>
              <button
                onClick={handleClosePreview}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <iframe
                src={previewDocument.documentUrl}
                className="w-full h-full border-0"
                title={previewDocument.documentName}
                allowFullScreen
              />
            </div>

            <div className="p-4 border-t flex justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Sent by:{" "}
                  <span className="font-medium">
                    {previewDocument.senderName}
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
                  <button
                    onClick={() => {
                      handleApproveReview(previewDocument.id);
                      handleClosePreview();
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleRejectReview(previewDocument.id);
                      handleClosePreview();
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
