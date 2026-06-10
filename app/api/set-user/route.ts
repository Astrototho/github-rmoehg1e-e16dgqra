import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Create response and set cookie via headers
    const response = NextResponse.json({ success: true });
    response.cookies.set('currentUserId', userId, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error setting user cookie:', error);
    return NextResponse.json(
      { error: 'Failed to set user' },
      { status: 500 }
    );
  }
}
