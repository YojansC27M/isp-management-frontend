import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/common/prisma/prisma.service"

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(days = 7, actorId?: string) {
    const now = new Date()
    const fromDate = new Date(now.getTime() - days * 86_400_000)

    const [ticketCounts, visitCounts, overdueVisits, recentlyUpdatedTickets] = await Promise.all([
      this.prisma.ticket.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),
      this.prisma.visit.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),
      this.prisma.visit.count({
        where: {
          status: "scheduled",
          scheduledAt: {
            lt: now,
          },
        },
      }),
      this.prisma.ticket.findMany({
        where: {
          updatedAt: {
            gte: fromDate,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
        include: {
          client: {
            select: { name: true },
          },
        },
      }),
    ])

    const ticketsByStatus = Object.fromEntries(
      ticketCounts.map((row) => [row.status, row._count._all]),
    )
    const visitsByStatus = Object.fromEntries(
      visitCounts.map((row) => [row.status, row._count._all]),
    )

    const payload = {
      windowDays: days,
      windowStartAt: fromDate.toISOString(),
      generatedAt: now.toISOString(),
      tickets: {
        total: ticketCounts.reduce((acc, row) => acc + row._count._all, 0),
        open: ticketsByStatus["open"] ?? 0,
        inProgress: ticketsByStatus["in_progress"] ?? 0,
        waiting: ticketsByStatus["waiting"] ?? 0,
        resolved: ticketsByStatus["resolved"] ?? 0,
        closed: ticketsByStatus["closed"] ?? 0,
      },
      visits: {
        total: visitCounts.reduce((acc, row) => acc + row._count._all, 0),
        scheduled: visitsByStatus["scheduled"] ?? 0,
        inProgress: visitsByStatus["in_progress"] ?? 0,
        completed: visitsByStatus["completed"] ?? 0,
        canceled: visitsByStatus["canceled"] ?? 0,
        overdueScheduled: overdueVisits,
      },
      recentTicketActivity: recentlyUpdatedTickets.map((ticket) => ({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        clientName: ticket.client.name,
        updatedAt: ticket.updatedAt.toISOString(),
      })),
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "support.overview.read",
        entity: "support_overview",
        metadata: {
          windowDays: days,
          generatedAt: payload.generatedAt,
        },
      },
    })

    return payload
  }
}
