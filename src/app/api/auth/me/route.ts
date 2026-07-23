import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { makeGetSessionProfile } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ user: null });
    }

    const getSessionProfile = makeGetSessionProfile();
    const userResponse = await getSessionProfile.execute(sessionUser.id);

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
