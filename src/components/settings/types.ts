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
