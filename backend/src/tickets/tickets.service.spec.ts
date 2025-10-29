import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { Priority, Status } from '@prisma/client';

describe('TicketsService', () => {
  let service: TicketsService;

  const mockPrismaService = {
    ticket: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    ticketStatusHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEmailService = {
    sendTicketStatusChangeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createTicketDto = {
      title: 'Test Ticket',
      description: 'Test Description',
      priority: Priority.HIGH,
    };

    const userId = 'user-123';

    const mockTicket = {
      id: 'ticket-123',
      title: createTicketDto.title,
      description: createTicketDto.description,
      priority: createTicketDto.priority,
      status: Status.OPEN,
      imageUrl: null,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
      },
    };

    it('should successfully create a ticket', async () => {
      mockPrismaService.ticket.create.mockResolvedValue(mockTicket);

      const result = await service.create(createTicketDto, userId);

      expect(result).toEqual({
        message: 'Ticket created successfully',
        ticket: mockTicket,
      });
      expect(mockPrismaService.ticket.create).toHaveBeenCalledWith({
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
    });

    it('should create a ticket with image URL', async () => {
      const createTicketDtoWithImage = {
        ...createTicketDto,
        imageUrl: '/uploads/test-image.jpg',
      };

      const mockTicketWithImage = {
        ...mockTicket,
        imageUrl: '/uploads/test-image.jpg',
      };

      mockPrismaService.ticket.create.mockResolvedValue(mockTicketWithImage);

      const result = await service.create(createTicketDtoWithImage, userId);

      expect(result.ticket.imageUrl).toBe('/uploads/test-image.jpg');
      expect(mockPrismaService.ticket.create).toHaveBeenCalledWith({
        data: {
          ...createTicketDtoWithImage,
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
    });

    it('should include user information in created ticket', async () => {
      mockPrismaService.ticket.create.mockResolvedValue(mockTicket);

      const result = await service.create(createTicketDto, userId);

      expect(result.ticket.user).toBeDefined();
      expect(result.ticket.user.id).toBe(userId);
      expect(result.ticket.user.username).toBe('testuser');
      expect(result.ticket.user.email).toBe('test@example.com');
    });
  });

  describe('findAll', () => {
    const userId = 'user-123';

    const mockTickets = [
      {
        id: 'ticket-1',
        title: 'Ticket 1',
        description: 'Description 1',
        priority: Priority.HIGH,
        status: Status.OPEN,
        imageUrl: null,
        userId,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        user: {
          id: userId,
          username: 'testuser',
          email: 'test@example.com',
        },
      },
      {
        id: 'ticket-2',
        title: 'Ticket 2',
        description: 'Description 2',
        priority: Priority.MEDIUM,
        status: Status.OPEN,
        imageUrl: null,
        userId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        user: {
          id: userId,
          username: 'testuser',
          email: 'test@example.com',
        },
      },
    ];

    it('should return all tickets for a user with pagination', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue(mockTickets);
      mockPrismaService.ticket.count.mockResolvedValue(2);

      const query = {
        sortBy: 'createdAt' as any,
        sortOrder: 'desc' as any,
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(userId, query);

      expect(result.tickets).toEqual(mockTickets);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockPrismaService.ticket.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          user: {
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
        skip: 0,
        take: 10,
      });
    });

    it('should filter tickets by status', async () => {
      const openTickets = [mockTickets[0]];
      mockPrismaService.ticket.findMany.mockResolvedValue(openTickets);
      mockPrismaService.ticket.count.mockResolvedValue(1);

      const query = {
        sortBy: 'createdAt' as any,
        sortOrder: 'desc' as any,
        status: Status.OPEN,
        page: 1,
        limit: 10,
      };

      await service.findAll(userId, query);

      expect(mockPrismaService.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, status: Status.OPEN },
        }),
      );
    });

    it('should filter tickets by priority', async () => {
      const highPriorityTickets = [mockTickets[0]];
      mockPrismaService.ticket.findMany.mockResolvedValue(highPriorityTickets);
      mockPrismaService.ticket.count.mockResolvedValue(1);

      const query = {
        sortBy: 'createdAt' as any,
        sortOrder: 'desc' as any,
        priority: Priority.HIGH,
        page: 1,
        limit: 10,
      };

      await service.findAll(userId, query);

      expect(mockPrismaService.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, priority: Priority.HIGH },
        }),
      );
    });

    it('should sort tickets by priority', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue(mockTickets);
      mockPrismaService.ticket.count.mockResolvedValue(2);

      const query = {
        sortBy: 'priority' as any,
        sortOrder: 'asc' as any,
        page: 1,
        limit: 10,
      };

      await service.findAll(userId, query);

      expect(mockPrismaService.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            priority: 'asc',
          },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue([mockTickets[1]]);
      mockPrismaService.ticket.count.mockResolvedValue(2);

      const query = {
        sortBy: 'createdAt' as any,
        sortOrder: 'desc' as any,
        page: 2,
        limit: 1,
      };

      const result = await service.findAll(userId, query);

      expect(result.pagination).toEqual({
        total: 2,
        page: 2,
        limit: 1,
        totalPages: 2,
      });
      expect(mockPrismaService.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          take: 1,
        }),
      );
    });

    it('should return empty array if user has no tickets', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue([]);
      mockPrismaService.ticket.count.mockResolvedValue(0);

      const query = {
        sortBy: 'createdAt' as any,
        sortOrder: 'desc' as any,
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(userId, query);

      expect(result.tickets).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findOne', () => {
    const userId = 'user-123';
    const ticketId = 'ticket-123';

    const mockTicket = {
      id: ticketId,
      title: 'Test Ticket',
      description: 'Test Description',
      priority: Priority.HIGH,
      status: Status.OPEN,
      imageUrl: null,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
      },
    };

    it('should return a specific ticket', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(mockTicket);

      const result = await service.findOne(ticketId, userId);

      expect(result).toEqual(mockTicket);
      expect(mockPrismaService.ticket.findFirst).toHaveBeenCalledWith({
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
    });

    it('should return null if ticket not found', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);

      const result = await service.findOne(ticketId, userId);

      expect(result).toBeNull();
    });

    it('should only return tickets belonging to the user', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);

      await service.findOne(ticketId, userId);

      expect(mockPrismaService.ticket.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: ticketId,
            userId,
          },
        }),
      );
    });
  });

  describe('createComment', () => {
    const ticketId = 'ticket-123';
    const userId = 'user-123';
    const content = 'This is a test comment';

    const mockTicket = {
      id: ticketId,
      userId,
      title: 'Test Ticket',
      description: 'Test Description',
      priority: Priority.MEDIUM,
      status: Status.OPEN,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockComment = {
      id: 'comment-123',
      content,
      ticketId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        isAdmin: false,
      },
    };

    it('should successfully create a comment', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(mockTicket);
      mockPrismaService.comment.create.mockResolvedValue(mockComment);

      const result = await service.createComment(ticketId, content, userId);

      expect(result).toEqual({
        message: 'Comment created successfully',
        comment: mockComment,
      });
      expect(mockPrismaService.comment.create).toHaveBeenCalledWith({
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
    });

    it('should throw NotFoundException if ticket not found', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);

      await expect(
        service.createComment(ticketId, content, userId),
      ).rejects.toThrow(
        'Ticket not found or you do not have permission to comment on it',
      );
    });

    it('should throw NotFoundException if user does not own the ticket', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);

      await expect(
        service.createComment(ticketId, content, userId),
      ).rejects.toThrow(
        'Ticket not found or you do not have permission to comment on it',
      );
    });
  });

  describe('getComments', () => {
    const ticketId = 'ticket-123';
    const userId = 'user-123';

    const mockTicket = {
      id: ticketId,
      userId,
      title: 'Test Ticket',
      description: 'Test Description',
      priority: Priority.MEDIUM,
      status: Status.OPEN,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockComments = [
      {
        id: 'comment-1',
        content: 'First comment',
        ticketId,
        userId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        user: {
          id: userId,
          username: 'testuser',
          email: 'test@example.com',
          isAdmin: false,
        },
      },
      {
        id: 'comment-2',
        content: 'Second comment',
        ticketId,
        userId,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        user: {
          id: userId,
          username: 'testuser',
          email: 'test@example.com',
          isAdmin: false,
        },
      },
    ];

    it('should successfully retrieve comments in chronological order', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(mockTicket);
      mockPrismaService.comment.findMany.mockResolvedValue(mockComments);

      const result = await service.getComments(ticketId, userId);

      expect(result).toEqual(mockComments);
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({
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
    });

    it('should throw NotFoundException if ticket not found', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);

      await expect(service.getComments(ticketId, userId)).rejects.toThrow(
        'Ticket not found or you do not have permission to view comments',
      );
    });

    it('should return empty array if no comments exist', async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(mockTicket);
      mockPrismaService.comment.findMany.mockResolvedValue([]);

      const result = await service.getComments(ticketId, userId);

      expect(result).toEqual([]);
    });
  });

  describe('createAdminComment', () => {
    const ticketId = 'ticket-123';
    const adminId = 'admin-123';
    const content = 'Admin support response';

    const mockTicket = {
      id: ticketId,
      userId: 'user-123',
      title: 'Test Ticket',
      description: 'Test Description',
      priority: Priority.MEDIUM,
      status: Status.OPEN,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockComment = {
      id: 'comment-123',
      content,
      ticketId,
      userId: adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: adminId,
        username: 'admin',
        email: 'admin@example.com',
        isAdmin: true,
      },
    };

    it('should allow admin to comment on any ticket', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.comment.create.mockResolvedValue(mockComment);

      const result = await service.createAdminComment(
        ticketId,
        content,
        adminId,
      );

      expect(result).toEqual({
        message: 'Comment created successfully',
        comment: mockComment,
      });
      expect(mockPrismaService.ticket.findUnique).toHaveBeenCalledWith({
        where: { id: ticketId },
      });
      expect(mockPrismaService.comment.create).toHaveBeenCalledWith({
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
    });

    it('should throw NotFoundException if ticket does not exist', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);

      await expect(
        service.createAdminComment(ticketId, content, adminId),
      ).rejects.toThrow('Ticket not found');
    });
  });

  describe('getAdminComments', () => {
    const ticketId = 'ticket-123';

    const mockTicket = {
      id: ticketId,
      userId: 'user-123',
      title: 'Test Ticket',
      description: 'Test Description',
      priority: Priority.MEDIUM,
      status: Status.OPEN,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockComments = [
      {
        id: 'comment-1',
        content: 'User comment',
        ticketId,
        userId: 'user-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          isAdmin: false,
        },
      },
      {
        id: 'comment-2',
        content: 'Admin response',
        ticketId,
        userId: 'admin-123',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        user: {
          id: 'admin-123',
          username: 'admin',
          email: 'admin@example.com',
          isAdmin: true,
        },
      },
    ];

    it('should allow admin to view comments on any ticket', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.comment.findMany.mockResolvedValue(mockComments);

      const result = await service.getAdminComments(ticketId);

      expect(result).toEqual(mockComments);
      expect(mockPrismaService.ticket.findUnique).toHaveBeenCalledWith({
        where: { id: ticketId },
      });
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({
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
    });

    it('should throw NotFoundException if ticket does not exist', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);

      await expect(service.getAdminComments(ticketId)).rejects.toThrow(
        'Ticket not found',
      );
    });

    it('should return empty array if no comments exist', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.comment.findMany.mockResolvedValue([]);

      const result = await service.getAdminComments(ticketId);

      expect(result).toEqual([]);
    });
  });

  describe('updateTicket', () => {
    const ticketId = 'ticket-123';
    const updateTicketDto = {
      title: 'Updated Title',
      description: 'Updated Description',
      priority: Priority.HIGH,
    };

    it('should update ticket successfully', async () => {
      const mockTicket = {
        id: ticketId,
        title: 'Old Title',
        description: 'Old Description',
        priority: Priority.MEDIUM,
        status: Status.OPEN,
        imageUrl: null,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedTicket = {
        ...mockTicket,
        ...updateTicketDto,
        updatedAt: new Date(),
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.ticket.update.mockResolvedValue(mockUpdatedTicket);

      const result = await service.updateTicket(ticketId, updateTicketDto);

      expect(result).toEqual({
        message: 'Ticket updated successfully',
        ticket: mockUpdatedTicket,
      });
      expect(mockPrismaService.ticket.update).toHaveBeenCalledWith({
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
    });

    it('should throw NotFoundException if ticket does not exist', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTicket(ticketId, updateTicketDto),
      ).rejects.toThrow('Ticket not found');
    });

    it('should update partial fields', async () => {
      const partialUpdate = { title: 'New Title Only' };
      const mockTicket = {
        id: ticketId,
        title: 'Old Title',
        description: 'Description',
        priority: Priority.MEDIUM,
        status: Status.OPEN,
        imageUrl: null,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedTicket = {
        ...mockTicket,
        title: 'New Title Only',
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.ticket.update.mockResolvedValue(mockUpdatedTicket);

      const result = await service.updateTicket(ticketId, partialUpdate);

      expect(result.ticket.title).toBe('New Title Only');
      expect(mockPrismaService.ticket.update).toHaveBeenCalledWith({
        where: { id: ticketId },
        data: partialUpdate,
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
    });
  });

  describe('deleteTicket', () => {
    const ticketId = 'ticket-123';

    it('should delete ticket successfully', async () => {
      const mockTicket = {
        id: ticketId,
        title: 'Test Ticket',
        description: 'Test Description',
        priority: Priority.MEDIUM,
        status: Status.OPEN,
        imageUrl: null,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.ticket.delete.mockResolvedValue(mockTicket);

      const result = await service.deleteTicket(ticketId);

      expect(result).toEqual({
        message: 'Ticket deleted successfully',
      });
      expect(mockPrismaService.ticket.delete).toHaveBeenCalledWith({
        where: { id: ticketId },
      });
    });

    it('should throw NotFoundException if ticket does not exist', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);

      await expect(service.deleteTicket(ticketId)).rejects.toThrow(
        'Ticket not found',
      );
      expect(mockPrismaService.ticket.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateComment', () => {
    const commentId = 'comment-123';
    const newContent = 'Updated comment content';

    it('should successfully update a comment', async () => {
      const mockUpdatedComment = {
        id: commentId,
        content: newContent,
        ticketId: 'ticket-123',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          isAdmin: false,
        },
      };

      mockPrismaService.comment.update.mockResolvedValue(mockUpdatedComment);

      const result = await service.updateComment(commentId, newContent);

      expect(result).toEqual({
        message: 'Comment updated successfully',
        comment: mockUpdatedComment,
      });
      expect(mockPrismaService.comment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: { content: newContent },
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
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockPrismaService.comment.update.mockRejectedValue(new Error('Record not found'));

      await expect(
        service.updateComment(commentId, newContent),
      ).rejects.toThrow('Comment not found');
    });
  });

  describe('deleteComment', () => {
    const commentId = 'comment-123';

    it('should successfully delete a comment', async () => {
      const mockComment = {
        id: commentId,
        content: 'Test comment',
        ticketId: 'ticket-123',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.comment.delete.mockResolvedValue(mockComment);

      const result = await service.deleteComment(commentId);

      expect(result).toEqual({
        message: 'Comment deleted successfully',
      });
      expect(mockPrismaService.comment.delete).toHaveBeenCalledWith({
        where: { id: commentId },
      });
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockPrismaService.comment.delete.mockRejectedValue(new Error('Record not found'));

      await expect(service.deleteComment(commentId)).rejects.toThrow(
        'Comment not found',
      );
    });
  });
});
