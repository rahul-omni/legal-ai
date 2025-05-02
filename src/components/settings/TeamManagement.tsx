import { Search, UserPlus } from "lucide-react";
import { useReducer } from "react";
import { InviteTeamModal } from "./InviteTeamModal";

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
interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Pending" | "Inactive";
  avatarInitial: string;
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
