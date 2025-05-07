import { OrgMembership, User } from "@prisma/client";
import { signOut } from "next-auth/react";

export interface UserStateProps {
  user?: User;
  hasAnyOrganization: boolean;
  orgMemberships?: OrgMembership[];
  selectedOrdMembership?: OrgMembership;
}

export type UserActionType =
  | {
      type: "FETCH_USER";
      payload: { user: User; orgMemberships: OrgMembership[] };
    }
  | {
      type: "LOGIN_USER";
      payload: { user: User; token: string };
    }
  | {
      type: "LOGOUT_USER";
    };

const initialState: UserStateProps = {
  hasAnyOrganization: false,
};

const reducer = (
  state: UserStateProps,
  action: UserActionType
): UserStateProps => {
  switch (action.type) {
    case "LOGIN_USER": {
      localStorage.setItem("userId", action.payload.user.id);
      localStorage.setItem("userEmail", action.payload.user.email);
      return {
        ...state,
        user: action.payload.user,
      };
    }
    case "FETCH_USER": {
      return {
        ...state,
        user: action.payload.user,
        hasAnyOrganization: action.payload.orgMemberships.length > 0,
        orgMemberships: action.payload.orgMemberships,
        selectedOrdMembership: action.payload.orgMemberships[0],
      };
    }
    case "LOGOUT_USER":
      signOut();
      return {
        ...state,
        user: undefined,
      };

    default:
      return state;
  }
};

export { initialState, reducer };

