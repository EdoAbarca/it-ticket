import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { GetTicketsQueryDto } from './dto/get-tickets-query.dto';
import { Status } from '@prisma/client';
import { EmailService } from '../auth/email.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Get all admin user IDs from the database
   */
  private async getAdminUserIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });
    return admins.map((admin) => admin.id);
  }

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

    // Notify all admins about the new ticket
    try {
      const adminIds = await this.getAdminUserIds();
      const notificationPromises = adminIds.map((adminId) =>
        this.notificationsService.createNotification(
          adminId,
          'COMMENT',
          `New ticket created: "${ticket.title}" by ${ticket.user.username}`,
          ticket.id,
        ),
      );
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Failed to create admin notifications:', error);
      // Don't fail the request if notifications fail
    }

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

    // Create in-app notification for ticket owner
    try {
      await this.notificationsService.createNotification(
        ticket.userId,
        'STATUS_CHANGE',
        `Ticket "${ticket.title}" status changed from ${oldStatus} to ${newStatus}`,
        ticketId,
      );
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't fail the request if notification fails
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

  // Comment methods
  async createComment(ticketId: string, content: string, userId: string) {
    // Verify that the ticket exists and belongs to the user
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
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

    if (!ticket) {
      throw new NotFoundException(
        'Ticket not found or you do not have permission to comment on it',
      );
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        ticketId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            isAdmin: true,
          },
        },
      },
    });

    // Notify all admins about the new comment
    try {
      const adminIds = await this.getAdminUserIds();
      const notificationPromises = adminIds.map((adminId) =>
        this.notificationsService.createNotification(
          adminId,
          'COMMENT',
          `${comment.user.username} commented on ticket "${ticket.title}"`,
          ticketId,
          comment.id,
        ),
      );
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Failed to create admin notifications:', error);
      // Don't fail the request if notifications fail
    }

    return {
      message: 'Comment created successfully',
      comment,
    };
  }

  async getComments(ticketId: string, userId: string) {
    // Verify that the ticket exists and belongs to the user
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        userId,
      },
    });

    if (!ticket) {
      throw new NotFoundException(
        'Ticket not found or you do not have permission to view comments',
      );
    }

    const comments = await this.prisma.comment.findMany({
      where: { ticketId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            isAdmin: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return comments;
  }

  // Admin comment methods
  async createAdminComment(ticketId: string, content: string, adminId: string) {
    // Verify that the ticket exists (no ownership check for admin)
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

    const comment = await this.prisma.comment.create({
      data: {
        content,
        ticketId,
        userId: adminId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            isAdmin: true,
          },
        },
      },
    });

    // Create notification for ticket owner if admin is commenting
    try {
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
        select: { username: true },
      });

      if (admin) {
        await this.notificationsService.createNotification(
          ticket.userId,
          'COMMENT',
          `${admin.username} commented on your ticket "${ticket.title}"`,
          ticketId,
          comment.id,
        );

        // Also notify other admins about this comment
        const adminIds = await this.getAdminUserIds();
        const otherAdminIds = adminIds.filter((id) => id !== adminId);
        const notificationPromises = otherAdminIds.map((otherAdminId) =>
          this.notificationsService.createNotification(
            otherAdminId,
            'COMMENT',
            `${admin.username} commented on ticket "${ticket.title}"`,
            ticketId,
            comment.id,
          ),
        );
        await Promise.all(notificationPromises);
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't fail the request if notification fails
    }

    return {
      message: 'Comment created successfully',
      comment,
    };
  }

  async getAdminComments(ticketId: string) {
    // Verify that the ticket exists (no ownership check for admin)
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const comments = await this.prisma.comment.findMany({
      where: { ticketId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            isAdmin: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return comments;
  }

  // Admin update and delete methods
  async updateTicket(ticketId: string, updateTicketDto: UpdateTicketDto) {
    // Check if ticket exists
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Update the ticket
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: updateTicketDto,
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
      message: 'Ticket updated successfully',
      ticket: updatedTicket,
    };
  }

  async deleteTicket(ticketId: string) {
    // Check if ticket exists
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Delete the ticket (cascade will handle related records)
    await this.prisma.ticket.delete({
      where: { id: ticketId },
    });

    return {
      message: 'Ticket deleted successfully',
    };
  }

  // Admin comment CRUD methods
  async updateComment(commentId: string, content: string) {
    try {
      // Update the comment directly - Prisma will throw if not found
      const updatedComment = await this.prisma.comment.update({
        where: { id: commentId },
        data: { content },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              isAdmin: true,
            },
          },
        },
      });

      return {
        message: 'Comment updated successfully',
        comment: updatedComment,
      };
    } catch {
      // Prisma throws P2025 when record is not found
      throw new NotFoundException('Comment not found');
    }
  }

  async deleteComment(commentId: string) {
    try {
      // Delete the comment directly - Prisma will throw if not found
      await this.prisma.comment.delete({
        where: { id: commentId },
      });

      return {
        message: 'Comment deleted successfully',
      };
    } catch {
      // Prisma throws P2025 when record is not found
      throw new NotFoundException('Comment not found');
    }
  }
}
