import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from './page';
import DashboardPage from './dashboard/page';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

const useSessionMock = vi.fn();
const signOutMock = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

describe('web smoke UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('redirects unauthenticated home visitors to /login', async () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated' });

    render(<HomePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });

  it('loads dashboard profile and feed for authenticated users', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });

    (fetch as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'u1',
            email: 'demo@qode.world',
            name: 'Demo User',
            avatarUrl: null,
            role: 'USER',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ page: 1, pageSize: 12, total: 0, items: [] }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

    render(<DashboardPage />);

    expect(await screen.findByText('Photo Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('demo@qode.world')).toBeInTheDocument();
    expect(await screen.findByText('No photos uploaded yet')).toBeInTheDocument();
  });
});
