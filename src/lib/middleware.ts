import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from './models';

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any, params?: any) => Promise<NextResponse>,
  requiredRoles?: UserRole[],
  params?: any
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (requiredRoles && !requiredRoles.includes(token.role as UserRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request, token, params);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
