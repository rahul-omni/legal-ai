import { OrgMembershipForAuth } from "@/app/api/(public-routes)/auth/types";
import { User } from "next-auth";
import { signOut } from "next-auth/react";



export interface UserStateProps {
  user?: User;
  hasAnyOrganization: boolean;
  orgMemberships?: OrgMembershipForAuth[];
  selectedOrdMembership?: OrgMembershipForAuth;
}

export type UserActionType =
  | {
      type: "FETCH_USER";
      payload: { user: User; orgMemberships: OrgMembershipForAuth[] };
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
        selectedOrdMembership: action.payload.orgMemberships?.[0],
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

