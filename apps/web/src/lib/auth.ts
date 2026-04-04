import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4001';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ?? 'development-nextauth-secret';

export type BackendUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
};

export type BackendAuthResponse = {
  accessToken: string;
  user: BackendUser;
};

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && profile && !token.backendAccessToken) {
        const googleProfile = profile as {
          sub?: string;
          email?: string;
          name?: string;
          picture?: string;
        };

        const response = await fetch(`${USER_SERVICE_URL}/internal/users/sync-oauth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'google',
            providerUserId: googleProfile.sub ?? account.providerAccountId,
            email: googleProfile.email ?? token.email ?? '',
            name: googleProfile.name ?? token.name ?? null,
            avatarUrl: googleProfile.picture ?? null,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to synchronize Google user with backend');
        }

        const backendAuth = (await response.json()) as BackendAuthResponse;
        token.backendAccessToken = backendAuth.accessToken;
        token.backendUser = backendAuth.user;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.backendUser?.id ?? token.sub ?? '';
        session.user.role = token.backendUser?.role ?? 'USER';
        session.user.name = token.backendUser?.name ?? session.user.name;
        session.user.image = token.backendUser?.avatarUrl ?? session.user.image;
      }

      session.backendAccessToken = token.backendAccessToken;
      return session;
    },
  },
};
