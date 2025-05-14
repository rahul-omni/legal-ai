
import { useState, useEffect, useRef } from "react";
import { Modal } from "./ui/Modal";
import { useUserContext } from "@/context/userContext";
import { apiClient } from "@/app/apiServices";
import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import { TeamMember } from "./settings/types";
import { useFetchTeamMembers } from "@/hooks/api/useTeamManagement";

interface ReviewRequestData {
  fileId: string;
  reviewerId: string;
  requesterId: string;
  orgId: string;
  reviewerEmail: string;  // Changed from reviewerId to reviewerEmail
}


export const ReviewRequestModal = ({
  isOpen,
  onClose,
  fileId,
  onSubmit,
  teamMembers
}: {
  isOpen: boolean;
  fileId: string;
  onClose: () => void;
  onSubmit: () => void;
  teamMembers: TeamMember[];
}) => {
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userState } = useUserContext();
  const { fetchTeamMembers } = useFetchTeamMembers();
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  

  // Use a ref to track the latest selected email
  const selectedEmailRef = useRef<string | null>(null);

  useEffect(() => {
    selectedEmailRef.current = selectedUserEmail;
    console.log("Current selectedEmail state:", selectedUserEmail);
    console.log("Current selectedEmail ref:", selectedEmailRef.current);
  }, [selectedUserEmail]);
  useEffect(() => {
    
    const loadTeamMembers = async () => {
      if (!isOpen || !userState.selectedOrdMembership?.organizationId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchTeamMembers(
          userState.selectedOrdMembership.organizationId
        );
        setUsers(data);
      } catch (err) {
        console.error("Error fetching team members:", err);
        setError("Failed to load team members");
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamMembers();
  }, [isOpen, userState.selectedOrdMembership?.organizationId]);

  const handleSubmit = async () => {
    const currentEmail = selectedEmailRef.current;
    console.log("Current selected email (from ref):", currentEmail);
    if (!currentEmail || !userState.user?.id || !userState.selectedOrdMembership?.organizationId) {
      return;
    }
    
    const requestData = {
      fileId,
      reviewerEmail: currentEmail,
      requesterId: userState.user.id,
      orgId: userState.selectedOrdMembership.organizationId
    };
    
    console.log("Submitting request with:", requestData);
      
    try {
      setIsLoading(true);
      const response = await apiClient.post(
        apiRouteConfig.privateRoutes.fileReviewReq,
        requestData
      );
      
      if (response.status >= 400) {
        throw new Error(response.data?.message || "Request failed");
      }
      
      console.log("Review request successful:", response.data);
      onSubmit();
      onClose();
    } catch (err) {
      console.error("Error submitting review request:", err);
      setError("Failed to submit review request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (email: string) => {
    console.log("Selecting user email:", email);
    setSelectedUserEmail(email);
   // selectedEmailRef.current = email;
  };
  const filteredUsers = users.filter(user => 
    user.status === "ACCEPTED"
  );

  console.log("filteredUsers", filteredUsers);
  
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Document Review"
      size="sm"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading team members...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        ) : (
          <>
            <p className="text-gray-600">
              Select a reviewer for this document:
            </p>

            <div className="max-h-60 overflow-y-auto border rounded-md">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.email}
                    className={`p-3 border-b cursor-pointer transition-colors ${
                      selectedUserEmail === user.email
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                    // onClick={() => {
                    //   console.log("Setting selected email to:", user.email);
                    //   setSelectedUserEmail(user.email);
                    // }}
                    onClick={() => handleUserSelect(user.email)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.email.split('@')[0]}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
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

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedUserEmail || isLoading}
                className={`px-4 py-2 rounded-md ${
                  selectedUserEmail && !isLoading
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}; 