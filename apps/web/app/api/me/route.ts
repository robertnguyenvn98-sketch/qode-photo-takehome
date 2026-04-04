import { NextResponse } from 'next/server';
import { authorizedBackendFetch } from '@/src/lib/backend';

export async function GET() {
  try {
    const response = await authorizedBackendFetch('/users/me');
    const body = await response.json();
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}
