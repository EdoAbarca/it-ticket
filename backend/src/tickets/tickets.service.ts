import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { GetTicketsQueryDto } from './dto/get-tickets-query.dto';
import { Status } from '@prisma/client';
import { EmailService } from '../auth/email.service';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(createTicketDto: CreateTicketDto, userId: string) {
    const ticket = await this.prisma.ticket.create({
      data: {
        ...createTicketDto,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Ticket created successfully',
      ticket,
    };
  }

  async findAll(userId: string, query: GetTicketsQueryDto) {
    const {
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      priority,
      page = 1,
      limit = 10,
    } = query;

    // Build where clause
    const where: any = { userId };
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Fetch tickets with filters, sorting, and pagination
    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    return this.prisma.ticket.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  // Admin methods
  async findAllTickets(query: GetTicketsQueryDto) {
    const {
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      priority,
      page = 1,
      limit = 10,
    } = query;

    // Build where clause (no userId filter for admin)
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Fetch tickets with filters, sorting, and pagination
    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findTicketById(id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        statusHistory: {
          include: {
            changedBy: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async updateTicketStatus(
    ticketId: string,
    newStatus: Status,
    adminId: string,
  ) {
    // Get current ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const oldStatus = ticket.status;

    // If status hasn't changed, don't update
    if (oldStatus === newStatus) {
      return {
        message: 'Ticket status unchanged',
        ticket,
      };
    }

    // Update ticket status and create history entry in a transaction
    const [updatedTicket] = await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: newStatus },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.ticketStatusHistory.create({
        data: {
          ticketId,
          oldStatus,
          newStatus,
          changedById: adminId,
        },
      }),
    ]);

    // Send notification email to ticket owner
    try {
      await this.emailService.sendTicketStatusChangeEmail(
        ticket.user.email,
        ticket.title,
        oldStatus,
        newStatus,
      );
    } catch (error) {
      console.error('Failed to send status change notification:', error);
      // Don't fail the request if email fails
    }

    return {
      message: 'Ticket status updated successfully',
      ticket: updatedTicket,
    };
  }

  async getTicketStatusHistory(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const history = await this.prisma.ticketStatusHistory.findMany({
      where: { ticketId },
      include: {
        changedBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      ticketId,
      history,
    };
  }
}
