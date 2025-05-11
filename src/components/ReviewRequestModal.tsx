import { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import useOrganizationUsers from "@/hooks/api/useOrg";
import { useUserContext } from "@/context/userContext";
import { apiClient } from "@/app/apiServices";
import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";

// Add ReviewRequestModal component
export const ReviewRequestModal = ({
  isOpen,
  onClose,
  fileId,
  onSubmit,
}: {
  isOpen: boolean;
  fileId: string;
  onClose: () => void;
  onSubmit: (_userId: string) => void;
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchUsers } = useOrganizationUsers();
  const { userState } = useUserContext();
  useEffect(() => {
    const fetchOrgUsers = async () => {
      setIsLoading(true);
      try {
        const org = await fetchUsers(
          userState.selectedOrdMembership!.organizationId
        );

        console.log("organisation", org);

        if (org) {
          setUsers(
            org.map((org) => ({
              id: org.id,
              name: org.user.name || "Unknown User",
              email: org.user.email || "Unknown Email",
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchOrgUsers();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (selectedUserId) {
      const reqData = {
        fileId,
        reviewerId: selectedUserId,
        orgId: userState.selectedOrdMembership?.organizationId,
      };
      const data = await apiClient.post(
        apiRouteConfig.privateRoutes.fileReviewReq,
        reqData
      );

      console.log(data);

      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Document Review"
      size="sm"
    >
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-gray-600">
            Select a user to request document review:
          </p>

          <div className="max-h-60 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className={`p-3 mb-2 border rounded cursor-pointer hover:bg-gray-50 
                    ${
                      selectedUserId === user.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                onClick={() => setSelectedUserId(user.id)}
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <p className="text-center py-4 text-gray-500">No users available</p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedUserId}
              className={`px-4 py-2 rounded-md ${
                selectedUserId
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Send Request
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};
