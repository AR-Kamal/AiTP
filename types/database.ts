export interface Profile {
  id: string;
  full_name: string;
  nationality: string;
  age: number;
  avatar_url?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
}