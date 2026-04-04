import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const {
  authorizedServiceFetchMock,
  requireAuthenticatedSessionMock,
} = vi.hoisted(() => ({
  authorizedServiceFetchMock: vi.fn(),
  requireAuthenticatedSessionMock: vi.fn(),
}));

vi.mock('@/src/lib/backend', () => ({
  authorizedServiceFetch: authorizedServiceFetchMock,
  requireAuthenticatedSession: requireAuthenticatedSessionMock,
}));

describe('/api/me route integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('proxies /users/me through user service', async () => {
    requireAuthenticatedSessionMock.mockResolvedValue({ backendAccessToken: 'token' });
    authorizedServiceFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'u1', email: 'demo@qode.world' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe('u1');
    expect(authorizedServiceFetchMock).toHaveBeenCalledWith('user', '/users/me', {}, expect.any(Object));
  });
});
