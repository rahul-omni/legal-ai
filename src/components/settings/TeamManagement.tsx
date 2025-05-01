import { useRoleContext } from "@/context/roleContext";
import { useUserContext } from "@/context/userContext";
import { useInviteTemMember } from "@/hooks/api/useTeamManagement";
import { Search, UserPlus } from "lucide-react";
import { useReducer } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface InviteFormInputs {
  email: string;
  roleId: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Pending" | "Inactive";
  avatarInitial: string;
}

type State = {
  searchQuery: string;
  rowsPerPage: number;
  isModalOpen: boolean;
};

type Action =
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_ROWS_PER_PAGE"; payload: number }
  | { type: "SET_MODAL_OPEN"; payload: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_ROWS_PER_PAGE":
      return { ...state, rowsPerPage: action.payload };
    case "SET_MODAL_OPEN":
      return { ...state, isModalOpen: action.payload };

    default:
      return state;
  }
}

function SearchBar({
  state,
  dispatch,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <div className="relative w-96">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Filter"
        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={state.searchQuery}
        onChange={(e) =>
          dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })
        }
      />
    </div>
  );
}

function InviteTeamModal({
  state,
  dispatch,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
}) {
  const { getAllRoles } = useRoleContext();
  const { register, handleSubmit } = useForm<InviteFormInputs>(); // Add the type here
  const { inviteTeamMember } = useInviteTemMember();
  const { userState } = useUserContext();

  const roles = getAllRoles();

  const onSubmit: SubmitHandler<InviteFormInputs> = async (data) => {
    dispatch({ type: "SET_MODAL_OPEN", payload: false });
    const res = await inviteTeamMember({
      ...data,
      orgId: undefined, // TODO - Replace with actual orgId if needed
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

function TeamTable({ members }: { members: TeamMember[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-y bg-gray-50">
            <th className="px-6 py-3 text-sm font-semibold text-gray-600">
              Name
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-600">
              Email
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-600">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b">
              <td className="px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium">
                  {member.avatarInitial}
                </div>
                <span className="font-medium">{member.name}</span>
              </td>
              <td className="px-6 py-4 text-gray-600">{member.email}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    member.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : member.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {member.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  state,
  dispatch,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <div className="p-4 flex items-center justify-between border-t">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Rows per page</span>
        <select
          className="px-2 py-1 border rounded text-sm"
          value={state.rowsPerPage}
          onChange={(e) =>
            dispatch({
              type: "SET_ROWS_PER_PAGE",
              payload: Number(e.target.value),
            })
          }
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-1 rounded" disabled>
          <span className="text-2xl text-gray-400">«</span>
        </button>
        <button className="p-1 rounded" disabled>
          <span className="text-xl text-gray-400">‹</span>
        </button>
        <span className="text-sm text-gray-600">Page 1 of 1</span>
        <button className="p-1 rounded" disabled>
          <span className="text-xl text-gray-400">›</span>
        </button>
        <button className="p-1 rounded" disabled>
          <span className="text-2xl text-gray-400">»</span>
        </button>
      </div>
    </div>
  );
}

export function TeamManagement() {
  const [state, dispatch] = useReducer(reducer, {
    searchQuery: "",
    rowsPerPage: 10,
    isModalOpen: false,
  });

  const teamMembers: TeamMember[] = [
    {
      id: "1",
      name: "Rahul Raj",
      email: "rahul.raj@arthmate.com",
      status: "Active",
      avatarInitial: "R",
    },
    // Add more team members as needed
  ];

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 flex justify-between items-center">
        <SearchBar state={state} dispatch={dispatch} />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          onClick={() => dispatch({ type: "SET_MODAL_OPEN", payload: true })}
        >
          <UserPlus className="w-4 h-4" />
          Invite Team
        </button>
      </div>
      <TeamTable members={filteredMembers} />
      <Pagination state={state} dispatch={dispatch} />
      <InviteTeamModal state={state} dispatch={dispatch} />
    </div>
  );
}
