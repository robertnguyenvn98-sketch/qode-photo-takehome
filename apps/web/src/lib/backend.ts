import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4001';

export async function authorizedBackendFetch(path: string, init: RequestInit = {}) {
  const session = await getServerSession(authOptions);

  if (!session?.backendAccessToken) {
    throw new Error('Unauthorized');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.backendAccessToken}`);

  return fetch(`${USER_SERVICE_URL}${path}`, {
    ...init,
    headers,
  });
}
