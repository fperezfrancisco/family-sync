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
}
