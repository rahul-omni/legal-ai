import { Invitation, InvitationStatus } from "@prisma/client";

export interface InviteFormInputs {
  email: string;
  roleId: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: InvitationStatus;
  avatarInitial: string;
}

export type State = {
  searchQuery: string;
  rowsPerPage: number;
  isModalOpen: boolean;
  invitedTeamMembers: Invitation[];
};

export type Action =
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_ROWS_PER_PAGE"; payload: number }
  | { type: "SET_INVITED_TEAM_MEMBERS"; payload: Invitation[] }
  | { type: "SET_MODAL_OPEN"; payload: boolean };
