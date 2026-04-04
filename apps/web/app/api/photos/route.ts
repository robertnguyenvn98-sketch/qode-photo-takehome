import {
  authorizedServiceFetch,
  requireAuthenticatedSession,
} from '@/src/lib/backend';
import { forwardServiceResponse, normalizedErrorResponse } from '@/src/lib/gateway-response';
import { checkRateLimit } from '@/src/lib/rate-limit';

export async function GET(request: Request) {
  try {
    const session = await requireAuthenticatedSession();
    const { search } = new URL(request.url);
    const response = await authorizedServiceFetch('photo', `/photos${search}`, {}, session);

    return forwardServiceResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return normalizedErrorResponse(401, 'Unauthorized');
    }

    return normalizedErrorResponse(500, 'Failed to proxy GET /api/photos');
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuthenticatedSession();

    const rateLimit = checkRateLimit(`upload:${session.user.id}`, {
      maxRequests: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return normalizedErrorResponse(429, 'Too many upload requests. Please try again later.', {
        retryAfterMs: rateLimit.retryAfterMs,
      });
    }

    const formData = await request.formData();
    const response = await authorizedServiceFetch(
      'photo',
      '/photos',
      {
        method: 'POST',
        body: formData,
      },
      session,
    );

    return forwardServiceResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return normalizedErrorResponse(401, 'Unauthorized');
    }

    return normalizedErrorResponse(500, 'Failed to proxy POST /api/photos');
  }
}
