export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface UploaderSummary {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}
