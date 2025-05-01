import { clearAuthCookie, setAuthCookie } from "@/lib/auth";
import { OrgMembership, User } from "@prisma/client";

export interface UserStateProps {
  user?: User;
  orgMemberships?: OrgMembership[];
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

const initialState: UserStateProps = {};

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
        orgMemberships: action.payload.orgMemberships,
      };
    }
    case "LOGOUT_USER":
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      clearAuthCookie();
      return {
        ...state,
        user: undefined,
      };

    default:
      return state;
  }
};

export { initialState, reducer };
