import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple auth removed - all routes are now public
export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],  // No routes protected
};
