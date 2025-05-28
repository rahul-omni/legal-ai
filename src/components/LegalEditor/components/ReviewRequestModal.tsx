import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import { useUserContext } from "@/context/userContext";
import useAxios from "@/hooks/api/useAxios";
import { OrgMembership, User } from "@prisma/client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "../../ui/Modal";
import { charFromEmail, nameFromEmail } from "@/helper/texts";

type OrgMembershipRes = (OrgMembership & { user: Partial<User> })[];

export const ReviewRequestModal = ({
  isOpen,
  onClose,
  fileId,
}: {
  isOpen: boolean;
  fileId: string;
  onClose: () => void;
}) => {
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>();
  const [selectedReviewer, setSelectedReviewer] = useState<Partial<User>>();
  const { userState } = useUserContext();
  const { data: reviewers, fetchData, loading } = useAxios<OrgMembershipRes>();
  const { fetchData: sendReviewRequest, loading: reviewReqLoading } =
    useAxios();
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  useEffect(() => {
    const fetchOrgUsers = async () => {
      await fetchData(
        apiRouteConfig.privateRoutes.organization(
          userState.selectedOrdMembership!.organizationId
        )
      );
    };

    if (isOpen) {
      fetchOrgUsers();
    }
  }, [isOpen]);

  const sendWhatsAppNotification = async (reviewer: Partial<User>) => {
    if (!reviewer.mobileNumber) {
      console.log("No mobile number available for reviewer");
      return;
    }

    try {
      // Format phone number (remove all non-digit characters)
      let phoneNumber = reviewer.mobileNumber.replace(/\D/g, "");

      // Add country code if available, otherwise default to India (+91)
      if (reviewer.countryCode) {
        phoneNumber = reviewer.countryCode.replace(/\D/g, "") + phoneNumber;
      } else if (!phoneNumber.startsWith("91") && phoneNumber.length === 10) {
        phoneNumber = "91" + phoneNumber; // Default to India code if missing
      }

      // Ensure we don't send + in the payload (backend will add it)
      phoneNumber = phoneNumber.replace(/^\+/, ""); // Remove + if present
      console.log("Sending WhatsApp notification to:", phoneNumber);

      // Construct the message
      const requesterName =
        userState.user?.name || nameFromEmail(userState.user?.email || "");
      const reviewerName = reviewer.name || nameFromEmail(reviewer.email || "");
      const orgName =
        userState.selectedOrdMembership?.organizationName ||
        "your organization";

      const message =
        `📄 New Document Review Request\n\n` +
        `Hello ${reviewerName},\n\n` +
        `${requesterName} has requested you to review a document in ${orgName}.\n\n` +
        `Requested at: ${new Date().toLocaleString()}\n\n` +
        `Please log in to review the document.`;

      // Call your existing WhatsApp API endpoint
      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to send WhatsApp notification"
        );
      }

      console.log("WhatsApp notification sent successfully");
    } catch (error) {
      console.error("Error sending WhatsApp notification:", error);
      // Fail silently or show toast as per your preference
      // toast.error('Failed to send WhatsApp notification');
    }
  };

  const handleSubmit = async () => {
    if (!selectedReviewerId) {
      toast.error("Please select a reviewer");
      return;
    }

    const requestData = {
      fileId,
      reviewerId: selectedReviewerId,
      requesterId: userState.user!.id,
      orgId: userState.selectedOrdMembership!.organizationId,
    };

    try {
      // First send the review request
      await sendReviewRequest(
        apiRouteConfig.privateRoutes.fileReviewReq,
        "POST",
        requestData
      );

      // 2. Only proceed with notifications if review request was successful
      try {
        if (selectedReviewer?.mobileNumber) {
          setWhatsappLoading(true);
          await sendWhatsAppNotification(selectedReviewer);
          toast.success("Document and notification sent successfully");
        } else {
          toast.success("Document sent successfully (no notification sent)");
        }
      } catch (whatsappError) {
        console.error("Notification failed:", whatsappError);
        toast.success("Document sent successfully (notification failed)");
      } finally {
        setWhatsappLoading(false);
      }

      onClose();
    } catch (error) {
      console.error("Review request failed:", error);
      toast.error("Failed to send review request");
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedReviewerId(userId);
    const reviewer = reviewers?.find(
      (member) => member.userId === userId
    )?.user;
    setSelectedReviewer(reviewer);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Document Review"
      size="sm"
      footer={
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={reviewReqLoading}
          >
            Cancel
          </button>
          {/* <button
            onClick={handleSubmit}
            disabled={!selectedReviewerId || reviewReqLoading ||whatsappLoading}
            className={`px-4 py-2 rounded-md ${
              selectedReviewerId && !loading
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {reviewReqLoading ? "Sending..." : "Send Request"}
          </button> */}
          <button
            onClick={handleSubmit}
            disabled={
              !selectedReviewerId || reviewReqLoading || whatsappLoading
            }
            className={`px-4 py-2 rounded-md ${
              selectedReviewerId && !(reviewReqLoading || whatsappLoading)
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {reviewReqLoading || whatsappLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
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
                {reviewReqLoading
                  ? "Sending request..."
                  : "Sending notification..."}
              </div>
            ) : (
              "Send Request"
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading team members...</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600">
              Select a reviewer for this document:
            </p>

            <div className="max-h-60 overflow-y-auto border rounded-md">
              {!!reviewers && reviewers.length > 0 ? (
                reviewers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => handleUserSelect(member.userId)}
                    className={`p-3 border-b cursor-pointer transition-colors ${
                      selectedReviewerId === member.userId
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {member.user.name ?? charFromEmail(member.user.email!)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.user.name ??
                            nameFromEmail(member.user.email!)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {member.user.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          📞 {member.user.countryCode}{" "}
                          {member.user.mobileNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-gray-500">
                  No available team members
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
