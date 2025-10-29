import { Test, TestingModule } from '@nestjs/testing';
import { AdminTicketsController } from './admin-tickets.controller';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Priority, Status } from '@prisma/client';

describe('AdminTicketsController', () => {
  let controller: AdminTicketsController;

  const mockTicketsService = {
    findAllTickets: jest.fn(),
    findTicketById: jest.fn(),
    updateTicketStatus: jest.fn(),
    getTicketStatusHistory: jest.fn(),
    createAdminComment: jest.fn(),
    getAdminComments: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockAdminGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: mockTicketsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<AdminTicketsController>(AdminTicketsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllTickets', () => {
    it('should return all tickets in the system', async () => {
      const mockResponse = {
        tickets: [
          {
            id: 'ticket-1',
            title: 'Ticket 1',
            description: 'Description 1',
            priority: Priority.HIGH,
            status: Status.OPEN,
            imageUrl: null,
            userId: 'user-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              id: 'user-1',
              username: 'user1',
              email: 'user1@example.com',
            },
          },
          {
            id: 'ticket-2',
            title: 'Ticket 2',
            description: 'Description 2',
            priority: Priority.MEDIUM,
            status: Status.IN_PROGRESS,
            imageUrl: null,
            userId: 'user-2',
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              id: 'user-2',
              username: 'user2',
              email: 'user2@example.com',
            },
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockTicketsService.findAllTickets.mockResolvedValue(mockResponse);

      const query = {
        sortBy: 'createdAt' as any,
        sortOrder: 'desc' as any,
        page: 1,
        limit: 10,
      };

      const result = await controller.findAllTickets(query);

      expect(result).toEqual(mockResponse);
      expect(mockTicketsService.findAllTickets).toHaveBeenCalledWith(query);
    });
  });

  describe('findTicketById', () => {
    const ticketId = 'ticket-123';

    it('should return a ticket by id', async () => {
      const mockTicket = {
        id: ticketId,
        title: 'Test Ticket',
        description: 'Test Description',
        priority: Priority.HIGH,
        status: Status.OPEN,
        imageUrl: null,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
        },
        statusHistory: [],
      };

      mockTicketsService.findTicketById.mockResolvedValue(mockTicket);

      const result = await controller.findTicketById(ticketId);

      expect(result).toEqual(mockTicket);
      expect(mockTicketsService.findTicketById).toHaveBeenCalledWith(ticketId);
    });

    it('should throw NotFoundException when ticket does not exist', async () => {
      mockTicketsService.findTicketById.mockResolvedValue(null);

      await expect(controller.findTicketById(ticketId)).rejects.toThrow(
        'Ticket not found',
      );
    });
  });

  describe('updateTicketStatus', () => {
    const ticketId = 'ticket-123';
    const adminId = 'admin-123';
    const mockRequest = {
      user: { id: adminId },
    };

    it('should update ticket status successfully', async () => {
      const updateStatusDto = { status: Status.IN_PROGRESS };
      const mockResponse = {
        message: 'Ticket status updated successfully',
        ticket: {
          id: ticketId,
          title: 'Test Ticket',
          description: 'Test Description',
          priority: Priority.HIGH,
          status: Status.IN_PROGRESS,
          imageUrl: null,
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-1',
            username: 'testuser',
            email: 'test@example.com',
          },
        },
      };

      mockTicketsService.updateTicketStatus.mockResolvedValue(mockResponse);

      const result = await controller.updateTicketStatus(
        ticketId,
        updateStatusDto,
        mockRequest as any,
      );

      expect(result).toEqual(mockResponse);
      expect(mockTicketsService.updateTicketStatus).toHaveBeenCalledWith(
        ticketId,
        Status.IN_PROGRESS,
        adminId,
      );
    });
  });

  describe('getTicketStatusHistory', () => {
    const ticketId = 'ticket-123';

    it('should return ticket status history', async () => {
      const mockHistory = {
        ticketId,
        history: [
          {
            id: 'history-1',
            ticketId,
            oldStatus: Status.OPEN,
            newStatus: Status.IN_PROGRESS,
            changedById: 'admin-1',
            createdAt: new Date(),
            changedBy: {
              id: 'admin-1',
              username: 'admin',
              email: 'admin@example.com',
            },
          },
        ],
      };

      mockTicketsService.getTicketStatusHistory.mockResolvedValue(mockHistory);

      const result = await controller.getTicketStatusHistory(ticketId);

      expect(result).toEqual(mockHistory);
      expect(mockTicketsService.getTicketStatusHistory).toHaveBeenCalledWith(
        ticketId,
      );
    });
  });

  describe('createComment', () => {
    const ticketId = 'ticket-123';
    const adminId = 'admin-123';
    const mockRequest = {
      user: { id: adminId },
    };

    it('should allow admin to create a comment on any ticket', async () => {
      const createCommentDto = { content: 'Admin support response' };
      const mockResponse = {
        message: 'Comment created successfully',
        comment: {
          id: 'comment-123',
          content: 'Admin support response',
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
        },
      };

      mockTicketsService.createAdminComment.mockResolvedValue(mockResponse);

      const result = await controller.createComment(
        ticketId,
        createCommentDto,
        mockRequest as any,
      );

      expect(result).toEqual(mockResponse);
      expect(mockTicketsService.createAdminComment).toHaveBeenCalledWith(
        ticketId,
        'Admin support response',
        adminId,
      );
    });
  });

  describe('getComments', () => {
    const ticketId = 'ticket-123';

    it('should allow admin to view comments on any ticket', async () => {
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

      mockTicketsService.getAdminComments.mockResolvedValue(mockComments);

      const result = await controller.getComments(ticketId);

      expect(result).toEqual(mockComments);
      expect(mockTicketsService.getAdminComments).toHaveBeenCalledWith(
        ticketId,
      );
    });
  });
});
