import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import { useUserContext } from "@/context/userContext";
import useAxios from "@/hooks/api/useAxios";
import { OrgMembership, User } from "@prisma/client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "./ui/Modal";
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
  const { userState } = useUserContext();
  const { data: reviewers, fetchData, loading } = useAxios<OrgMembershipRes>();
  const { fetchData: sendReviewRequest, loading: reviewReqLoading } =
    useAxios();

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

    await sendReviewRequest(
      apiRouteConfig.privateRoutes.fileReviewReq,
      "POST",
      requestData
    );

    onClose();
  };

  const handleUserSelect = (email: string) => {
    setSelectedReviewerId(email);
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
          <button
            onClick={handleSubmit}
            disabled={!selectedReviewerId || reviewReqLoading}
            className={`px-4 py-2 rounded-md ${
              selectedReviewerId && !loading
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {reviewReqLoading ? "Sending..." : "Send Request"}
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
