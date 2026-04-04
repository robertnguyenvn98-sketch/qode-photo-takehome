'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', padding: '48px', maxWidth: '720px' }}>
      <h1>Qode Photo Takehome</h1>
      <p>Login with Google, then the gateway will exchange that session for an internal backend JWT.</p>

      {status === 'loading' ? <p>Loading session...</p> : null}

      {!session ? (
        <button onClick={() => signIn('google')}>Sign in with Google</button>
      ) : (
        <>
          <pre style={{ background: '#f5f5f5', padding: '16px', overflowX: 'auto' }}>
            {JSON.stringify(
              {
                name: session.user?.name,
                email: session.user?.email,
                role: session.user?.role,
                backendAccessToken: session.backendAccessToken ? 'stored' : 'missing',
              },
              null,
              2,
            )}
          </pre>
          <button onClick={() => signOut()}>Sign out</button>
        </>
      )}
    </main>
  );
}
