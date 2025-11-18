import { User } from "./auth";

export interface GroupMember {
  user: User;
  role: "owner" | "admin" | "member" | "guest";
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  type: "family" | "friends" | "work" | "other";
  owner: string;
  members: GroupMember[];
  createdAt: string;
}
