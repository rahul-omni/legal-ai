import { useUserContext } from "@/context/userContext";
import { useFetchTeamMembers } from "@/hooks/api/useTeamManagement";
import { Search, UserPlus } from "lucide-react";
import { useEffect, useReducer } from "react";
import { InviteTeamModal } from "./InviteTeamModal";
import { Action, State, TeamMember } from "./types";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_ROWS_PER_PAGE":
      return { ...state, rowsPerPage: action.payload };
    case "SET_MODAL_OPEN":
      return { ...state, isModalOpen: action.payload };
    case "SET_INVITED_TEAM_MEMBERS":
      return { ...state, invitedTeamMembers: action.payload };
    default:
      return state;
  }
}

export function TeamManagement() {
  const [state, dispatch] = useReducer(reducer, {
    searchQuery: "",
    rowsPerPage: 10,
    isModalOpen: false,
    invitedTeamMembers: [],
  });
  const { userState } = useUserContext();
  const { fetchTeamMembers } = useFetchTeamMembers();

  useEffect(() => {
    (async () => {
      try {
        console.log(
          "Fetching team members for orgId:",
          userState.selectedOrdMembership?.organizationId
        );
        const data = await fetchTeamMembers(
          userState.selectedOrdMembership!.organizationId
        );
        console.log("Fetched team members:", data);
        dispatch({ type: "SET_INVITED_TEAM_MEMBERS", payload: data! });
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    })();
  }, []);

  const teamMembers: TeamMember[] = state.invitedTeamMembers.map((member) => {
    return {
      id: member.id,
      name: member.email.split("@")[0],
      email: member.email,
      status: member.status,
      avatarInitial: member.email.charAt(0).toUpperCase(),
    };
  });

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
      <InviteTeamModal state={state} dispatch={dispatch} teamMembers={teamMembers} />
    </div>
  );
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



function TeamTable({ members }: { members: TeamMember[] }) {
  console.log("members", members);
  
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
                    member.status === "ACCEPTED"
                      ? "bg-green-100 text-green-800"
                      : member.status === "PENDING"
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
