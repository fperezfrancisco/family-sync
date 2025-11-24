export interface User {
  id: string | null;
  email: string;
  name: string;
  dob?: string;
  gender?: string;
  phone?: {
    countryCode: string;
    number: string;
  };
  groups: string[];
  // New structured avatar/banner fields
  avatar?: {
    fullSize?: string | null;
    small?: string | null;
  };
  banner?: {
    fullSize?: string | null;
    small?: string | null;
  };
  // Legacy fields for backward compatibility
  avatarUrl?: string;
  bannerUrl?: string;
}
