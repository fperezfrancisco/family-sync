export interface GroupMember {
  id: string;
  name: string;
  email: string;
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
