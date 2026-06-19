import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const getAuditPrisma = (userId: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async create({ model, operation, args, query }) {
          if (model === 'AuditLog') return query(args)
          const result = await query(args)
          await prisma.auditLog.create({
            data: {
              modelName: model,
              action: 'CREATE',
              recordId: (result as any).id,
              newData: result as any,
              userId: userId
            }
          })
          return result
        },
        async update({ model, operation, args, query }) {
          if (model === 'AuditLog') return query(args)
          // Tenta buscar os dados originais se possível (depende de args.where conter ID único)
          let oldData = null
          try {
            if (args.where && Object.keys(args.where).length > 0) {
              oldData = await (prisma as any)[model].findFirst({ where: args.where })
            }
          } catch (e) {}

          const result = await query(args)
          await prisma.auditLog.create({
            data: {
              modelName: model,
              action: 'UPDATE',
              recordId: (result as any).id,
              oldData: oldData as any,
              newData: result as any,
              userId: userId
            }
          })
          return result
        },
        async delete({ model, operation, args, query }) {
          if (model === 'AuditLog') return query(args)
          let oldData = null
          try {
            if (args.where && Object.keys(args.where).length > 0) {
              oldData = await (prisma as any)[model].findFirst({ where: args.where })
            }
          } catch (e) {}

          const result = await query(args)
          await prisma.auditLog.create({
            data: {
              modelName: model,
              action: 'DELETE',
              recordId: (result as any).id,
              oldData: oldData as any,
              userId: userId
            }
          })
          return result
        },
        async createMany({ model, operation, args, query }) {
          if (model === 'AuditLog') return query(args)
          const result = await query(args)
          await prisma.auditLog.create({
            data: {
              modelName: model,
              action: 'CREATE_MANY',
              recordId: 'BULK',
              newData: args.data as any,
              userId: userId
            }
          })
          return result
        },
        async updateMany({ model, operation, args, query }) {
          if (model === 'AuditLog') return query(args)
          const result = await query(args)
          await prisma.auditLog.create({
            data: {
              modelName: model,
              action: 'UPDATE_MANY',
              recordId: 'BULK',
              newData: args.data as any,
              userId: userId
            }
          })
          return result
        },
        async deleteMany({ model, operation, args, query }) {
          if (model === 'AuditLog') return query(args)
          const result = await query(args)
          await prisma.auditLog.create({
            data: {
              modelName: model,
              action: 'DELETE_MANY',
              recordId: 'BULK',
              oldData: args.where as any,
              userId: userId
            }
          })
          return result
        }
      }
    }
  })
}

export default prisma
