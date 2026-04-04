import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const {
  authorizedServiceFetchMock,
  requireAuthenticatedSessionMock,
  checkRateLimitMock,
} = vi.hoisted(() => ({
  authorizedServiceFetchMock: vi.fn(),
  requireAuthenticatedSessionMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
}));

vi.mock('@/src/lib/backend', () => ({
  authorizedServiceFetch: authorizedServiceFetchMock,
  requireAuthenticatedSession: requireAuthenticatedSessionMock,
}));

vi.mock('@/src/lib/rate-limit', () => ({
  checkRateLimit: checkRateLimitMock,
}));

describe('/api/photos/:id/comments route integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedSessionMock.mockResolvedValue({
      user: { id: 'u1' },
      backendAccessToken: 'token',
    });
  });

  it('GET proxies comment list request', async () => {
    authorizedServiceFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await GET(
      new Request('http://localhost:3000/api/photos/p1/comments?page=1&pageSize=5'),
      { params: Promise.resolve({ id: 'p1' }) },
    );

    expect(response.status).toBe(200);
    expect(authorizedServiceFetchMock).toHaveBeenCalledWith(
      'photo',
      '/photos/p1/comments?page=1&pageSize=5',
      {},
      expect.any(Object),
    );
  });

  it('POST proxies create comment payload', async () => {
    checkRateLimitMock.mockReturnValue({ allowed: true, remaining: 10 });
    authorizedServiceFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'c1', content: 'hello' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await POST(
      new Request('http://localhost:3000/api/photos/p1/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: 'hello' }),
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    );

    const payload = await response.json();
    expect(response.status).toBe(201);
    expect(payload.id).toBe('c1');
    expect(checkRateLimitMock).toHaveBeenCalledWith('comment:u1', expect.any(Object));
  });
});
