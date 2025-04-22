import { clearAuthCookie, setAuthCookie } from "@/lib/auth";
import { User } from "@prisma/client";

export interface UserStateProps {
  user?: User;
}

export type UserActionType =
  | {
      type: "ADD_USER";
      payload: { user: User; token: string };
    }
  | {
      type: "REMOVE_USER";
      payload: string;
    };

const initialState: UserStateProps = {};

const reducer = (
  state: UserStateProps,
  action: UserActionType
): UserStateProps => {
  switch (action.type) {
    case "ADD_USER": {
      setAuthCookie(action.payload.token);
      return {
        ...state,
        user: action.payload.user,
      };
    }
    case "REMOVE_USER":
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
