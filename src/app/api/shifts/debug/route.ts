import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const url = new URL(request.url);
  return NextResponse.json({
    ok: true,
    message: 'Shifts API is working',
    requestUrl: url.toString(),
  });
}
