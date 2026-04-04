import { NextResponse } from 'next/server';

export function normalizedErrorResponse(status: number, message: string, details?: unknown) {
  return NextResponse.json(
    {
      message,
      ...(details !== undefined ? { details } : {}),
    },
    { status },
  );
}

export async function forwardServiceResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => ({ message: response.statusText }));
    return NextResponse.json(payload, { status: response.status });
  }

  const text = await response.text();
  return NextResponse.json(
    {
      message: text || response.statusText || 'Unexpected service response',
    },
    { status: response.status },
  );
}
