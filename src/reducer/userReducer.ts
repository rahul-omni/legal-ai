import { OrgMembershipForAuth } from "@/app/api/(public-routes)/auth/types";
import { User } from "next-auth";

export interface UserSubscription {
  id: string;
  userId: string;
  subscriptionPlanId: string;
  paymentId: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  subscriptionPlan?: {
    id: string;
    title: string;
    description: string | null;
    features: string[];
    discountedPrice: number;
    price: number;
    duration: number | null;
  };
}

export interface UserStateProps {
  user?: User;
  hasAnyOrganization: boolean;
  orgMemberships?: OrgMembershipForAuth[];
  selectedOrdMembership?: OrgMembershipForAuth;
  subscription?: UserSubscription | null;
  hasActiveSubscription?: boolean;
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
    }
  | {
      type: "FETCH_SUBSCRIPTION";
      payload: { subscription: UserSubscription | null; hasActiveSubscription: boolean };
    }
  | {
      type: "UPDATE_SUBSCRIPTION";
      payload: { subscription: UserSubscription | null };
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
    case "LOGOUT_USER": {
      return {
        ...state,
        user: undefined,
        subscription: undefined,
        hasActiveSubscription: false,
      };
    }
    case "FETCH_SUBSCRIPTION": {
      return {
        ...state,
        subscription: action.payload.subscription,
        hasActiveSubscription: action.payload.hasActiveSubscription,
      };
    }
    case "UPDATE_SUBSCRIPTION": {
      return {
        ...state,
        subscription: action.payload.subscription,
        hasActiveSubscription: action.payload.subscription !== null && action.payload.subscription.status === "ACTIVE",
      };
    }

    default:
      return state;
  }
};

export { initialState, reducer };
