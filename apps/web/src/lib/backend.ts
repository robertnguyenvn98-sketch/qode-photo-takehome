import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from './auth';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4001';
const PHOTO_SERVICE_URL = process.env.PHOTO_SERVICE_URL ?? 'http://localhost:4002';

export type BackendServiceName = 'user' | 'photo';

function getServiceBaseUrl(service: BackendServiceName) {
  return service === 'photo' ? PHOTO_SERVICE_URL : USER_SERVICE_URL;
}

export async function requireAuthenticatedSession() {
  const session = await getServerSession(authOptions);
  if (!session?.backendAccessToken) {
    throw new Error('Unauthorized');
  }

  return session;
}

export async function authorizedServiceFetch(
  service: BackendServiceName,
  path: string,
  init: RequestInit = {},
  session?: Session,
) {
  const activeSession = session ?? (await requireAuthenticatedSession());

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${activeSession.backendAccessToken}`);

  return fetch(`${getServiceBaseUrl(service)}${path}`, {
    ...init,
    headers,
  });
}
