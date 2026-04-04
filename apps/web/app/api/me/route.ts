import { NextResponse } from 'next/server';
import {
  authorizedServiceFetch,
  requireAuthenticatedSession,
} from '@/src/lib/backend';
import { forwardServiceResponse, normalizedErrorResponse } from '@/src/lib/gateway-response';

export async function GET() {
  try {
    const session = await requireAuthenticatedSession();
    const response = await authorizedServiceFetch('user', '/users/me', {}, session);
    return forwardServiceResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return normalizedErrorResponse(401, 'Unauthorized');
    }

    return normalizedErrorResponse(500, 'Failed to proxy /api/me');
  }
}
