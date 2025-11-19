// INVITATION SYSTEM: TypeScript types for group invitations

export interface GroupInvitation {
  id: string;
  groupId: string;
  inviterUserId: string;
  inviteeEmail: string;
  inviteeUserId?: string;
  message?: string;
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  respondedAt?: string;
}

export interface GroupInvitationWithDetails {
  id: string;
  group: {
    id: string;
    name: string;
    description?: string;
    type: "family" | "friends" | "work" | "other";
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
  inviteeEmail: string;
  inviteeUser?: {
    id: string;
    name: string;
    email: string;
  };
  message?: string;
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  respondedAt?: string;
  canRespond?: boolean;
  isExpired?: boolean;
}

export interface CreateInvitationData {
  email: string;
  message?: string;
  role?: "admin" | "member" | "guest";
}

export interface InvitationResponse {
  action: "accept" | "decline";
  message?: string;
}

// API Response types
export interface CreateInvitationResponse {
  message: string;
  invitation: GroupInvitation;
}

export interface GetInvitationsResponse {
  message: string;
  invitations: GroupInvitationWithDetails[];
}

export interface GetUserInvitationsResponse {
  message: string;
  invitations: GroupInvitationWithDetails[];
}

export interface RespondToInvitationResponse {
  message: string;
  invitation: {
    id: string;
    group: {
      id: string;
      name: string;
      description?: string;
      type: string;
    };
    action: "accept" | "decline";
    respondedAt: string;
  };
}
