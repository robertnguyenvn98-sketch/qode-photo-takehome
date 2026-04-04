import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    backendAccessToken?: string;
    user: DefaultSession['user'] & {
      id: string;
      role: 'USER' | 'ADMIN';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendAccessToken?: string;
    backendUser?: {
      id: string;
      email: string;
      name: string | null;
      avatarUrl: string | null;
      role: 'USER' | 'ADMIN';
    };
  }
}
