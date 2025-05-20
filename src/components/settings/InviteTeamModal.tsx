import { useRoleContext } from "@/context/roleContext";
import { useUserContext } from "@/context/userContext";
import {
  useFetchInvitations,
  useInviteTemMember,
} from "@/hooks/api/useTeamManagement";
import { Dispatch } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Action, InviteFormInputs, State, TeamMember } from "./types";
import { Modal } from "../ui/Modal";
import { ModalButton, ModalFooter } from "../ui/ModalButton";

export function InviteTeamModal({
  state,
  dispatch,
  teamMembers,
}: {
  state: State;
  dispatch: Dispatch<Action>;
  teamMembers: TeamMember[]; 
}) {
  const { getAllRoles } = useRoleContext();
  const { register, handleSubmit } = useForm<InviteFormInputs>(); 
  const { inviteTeamMember } = useInviteTemMember();
  const { fetchInvitations } = useFetchInvitations();
  const { userState } = useUserContext();
  const roles = getAllRoles();

  const handleClose = () => {
    dispatch({ type: "SET_MODAL_OPEN", payload: false });
  };

  const onSubmit: SubmitHandler<InviteFormInputs> = async (data) => {
    handleClose();
    console.log("userstate", userState);
    const res = await inviteTeamMember({
      ...data,
      orgId: userState.selectedOrdMembership!.organizationId,
    });

    if (!res) return;

    const invitations = await fetchInvitations(
      userState.selectedOrdMembership!.organizationId
    );

    if (!invitations) return;
    dispatch({ type: "SET_INVITED_TEAM_MEMBERS", payload: invitations });

    toast.success(res.successMessage!);
  };

  return (
    <Modal
      isOpen={state.isModalOpen}
      onClose={handleClose}
      title="Invite Team Member"
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          placeholder="Enter email address"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Role
        </label>
        <select
          {...register("roleId")}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>

        <ModalFooter>
          <ModalButton 
            type="button" 
            variant="secondary" 
            onClick={handleClose}
          >
            Cancel
          </ModalButton>
          <ModalButton 
            type="submit"
            variant="primary"
          >
            Invite
          </ModalButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
