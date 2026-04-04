import {
  authorizedServiceFetch,
  requireAuthenticatedSession,
} from '@/src/lib/backend';
import { forwardServiceResponse, normalizedErrorResponse } from '@/src/lib/gateway-response';
import { checkRateLimit } from '@/src/lib/rate-limit';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireAuthenticatedSession();
    const { id } = await context.params;
    const { search } = new URL(request.url);

    const response = await authorizedServiceFetch(
      'photo',
      `/photos/${id}/comments${search}`,
      {},
      session,
    );

    return forwardServiceResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return normalizedErrorResponse(401, 'Unauthorized');
    }

    return normalizedErrorResponse(500, 'Failed to proxy GET /api/photos/:id/comments');
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireAuthenticatedSession();
    const { id } = await context.params;

    const rateLimit = checkRateLimit(`comment:${session.user.id}`, {
      maxRequests: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return normalizedErrorResponse(429, 'Too many comment requests. Please try again later.', {
        retryAfterMs: rateLimit.retryAfterMs,
      });
    }

    const body = await request.json();
    const response = await authorizedServiceFetch(
      'photo',
      `/photos/${id}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      session,
    );

    return forwardServiceResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return normalizedErrorResponse(401, 'Unauthorized');
    }

    return normalizedErrorResponse(500, 'Failed to proxy POST /api/photos/:id/comments');
  }
}
