const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = process.env.INITIAL_ADMIN_EMAIL || 'admin@financial.com'
  const password = process.env.INITIAL_ADMIN_PASSWORD || 'admin'
  const name = 'Admin'

  const existing = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (existing) {
    console.log('Admin user already exists.')
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role: 'ADMIN'
    }
  })

  console.log(`Initial admin user created: ${admin.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
