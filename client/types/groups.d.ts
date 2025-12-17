export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member" | "guest";
}

export interface GroupCustomization {
  headerImage?: {
    source: "preset" | "custom";
    value: string;
    uploadedAt?: string;
    uploadedBy?: string;
  };
  accentColor?: {
    preset: string;
    hex: string;
  };
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  type: "family" | "friends" | "work" | "other";
  owner: string;
  members: GroupMember[];
  createdAt: string;
  customization?: GroupCustomization;
}
