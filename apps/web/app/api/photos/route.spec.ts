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

describe('/api/photos route integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedSessionMock.mockResolvedValue({
      user: { id: 'u1' },
      backendAccessToken: 'token',
    });
  });

  it('GET proxies list photos request to photo service', async () => {
    authorizedServiceFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await GET(new Request('http://localhost:3000/api/photos?page=1&pageSize=5'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ items: [] });
    expect(authorizedServiceFetchMock).toHaveBeenCalledWith(
      'photo',
      '/photos?page=1&pageSize=5',
      {},
      expect.any(Object),
    );
  });

  it('POST enforces rate limit and forwards multipart body', async () => {
    checkRateLimitMock.mockReturnValue({ allowed: true, remaining: 10 });
    authorizedServiceFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'photo-1' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const formData = new FormData();
    formData.append('file', new Blob(['fake-image']), 'demo.jpg');

    const response = await POST(
      new Request('http://localhost:3000/api/photos', {
        method: 'POST',
        body: formData,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual({ id: 'photo-1' });
    expect(checkRateLimitMock).toHaveBeenCalledWith('upload:u1', expect.any(Object));
  });
});
