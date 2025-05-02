import { useRoleContext } from "@/context/roleContext";
import { useUserContext } from "@/context/userContext";
import { useInviteTemMember } from "@/hooks/api/useTeamManagement";
import { Dispatch } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

export function InviteTeamModal({
  state,
  dispatch,
}: {
  state: State;
  dispatch: Dispatch<Action>;
}) {
  const { getAllRoles } = useRoleContext();
  const { register, handleSubmit } = useForm<InviteFormInputs>(); //s Add the type here
  const { inviteTeamMember } = useInviteTemMember();
  const { userState } = useUserContext();
  const roles = getAllRoles();

  const onSubmit: SubmitHandler<InviteFormInputs> = async (data) => {
    dispatch({ type: "SET_MODAL_OPEN", payload: false });
    const res = await inviteTeamMember({
      ...data,
      orgId: userState.selectedOrdMembership!.orgId,
    });

    if (!res) return;

    toast.success(res.successMessage);
  };

  if (!state.isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Invite Team Member</h2>
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
            {...register("roleId")} // Use "roleId" instead of "role" to match the type
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              onClick={() =>
                dispatch({ type: "SET_MODAL_OPEN", payload: false })
              }
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
