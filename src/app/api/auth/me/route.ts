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
        avatar: true,
        forcePasswordReset: true,
        lastLogin: true,
      }
    })

    if (!dbUser) {
      return NextResponse.json({ user: null })
    }

    const now = new Date()
    const fifteenMinutes = 15 * 60 * 1000
    const needsUpdate = !dbUser.lastLogin || (now.getTime() - new Date(dbUser.lastLogin).getTime() > fifteenMinutes)

    if (needsUpdate) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLogin: now }
      })
    }

    const { lastLogin, ...userResponse } = dbUser

    return NextResponse.json({ user: userResponse })
  } catch (error) {
    return NextResponse.json({ user: null })
  }
}
