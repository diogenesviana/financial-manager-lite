import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sessionUser = await getCurrentUser()
    if (!sessionUser) {
      return NextResponse.json({ user: null })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
      }
    })

    if (!dbUser) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user: dbUser })
  } catch (error) {
    return NextResponse.json({ user: null })
  }
}
