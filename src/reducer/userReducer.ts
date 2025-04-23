import { clearAuthCookie, setAuthCookie } from "@/lib/auth";
import { User } from "@prisma/client";

export interface UserStateProps {
  user?: User;
}

export type UserActionType =
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
      setAuthCookie(action.payload.token);
      return {
        ...state,
        user: action.payload.user,
      };
    }
    case "LOGOUT_USER":
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
