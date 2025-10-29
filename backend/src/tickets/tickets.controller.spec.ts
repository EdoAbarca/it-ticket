import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Priority, Status } from '@prisma/client';

describe('TicketsController', () => {
  let controller: TicketsController;

  const mockTicketsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    createComment: jest.fn(),
    getComments: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: mockTicketsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<TicketsController>(TicketsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    const ticketId = 'ticket-123';
    const userId = 'user-123';

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

    const mockRequest = {
      user: { id: userId },
    };

    it('should return a ticket when user owns it', async () => {
      mockTicketsService.findOne.mockResolvedValue(mockTicket);

      const result = await controller.findOne(ticketId, mockRequest as any);

      expect(result).toEqual(mockTicket);
      expect(mockTicketsService.findOne).toHaveBeenCalledWith(ticketId, userId);
    });

    it('should return null when ticket does not exist', async () => {
      mockTicketsService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(ticketId, mockRequest as any);

      expect(result).toBeNull();
      expect(mockTicketsService.findOne).toHaveBeenCalledWith(ticketId, userId);
    });

    it('should return null when user tries to access another users ticket', async () => {
      // The service will return null if userId doesn't match
      mockTicketsService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(ticketId, mockRequest as any);

      expect(result).toBeNull();
      expect(mockTicketsService.findOne).toHaveBeenCalledWith(ticketId, userId);
    });

    it('should include ticket details with image URL when present', async () => {
      const ticketWithImage = {
        ...mockTicket,
        imageUrl: '/uploads/test-image.jpg',
      };

      mockTicketsService.findOne.mockResolvedValue(ticketWithImage);

      const result = await controller.findOne(ticketId, mockRequest as any);

      expect(result.imageUrl).toBe('/uploads/test-image.jpg');
      expect(mockTicketsService.findOne).toHaveBeenCalledWith(ticketId, userId);
    });

    it('should include user information in returned ticket', async () => {
      mockTicketsService.findOne.mockResolvedValue(mockTicket);

      const result = await controller.findOne(ticketId, mockRequest as any);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(userId);
      expect(result.user.username).toBe('testuser');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should include all ticket metadata (dates, status, priority)', async () => {
      mockTicketsService.findOne.mockResolvedValue(mockTicket);

      const result = await controller.findOne(ticketId, mockRequest as any);

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.status).toBe(Status.OPEN);
      expect(result.priority).toBe(Priority.HIGH);
    });
  });

  describe('findAll', () => {
    const userId = 'user-123';
    const mockRequest = {
      user: { id: userId },
    };

    it('should return tickets for the authenticated user only', async () => {
      const mockResponse = {
        tickets: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      };

      mockTicketsService.findAll.mockResolvedValue(mockResponse);

      const query = {
        sortBy: 'createdAt' as any,
        sortOrder: 'desc' as any,
        page: 1,
        limit: 10,
      };

      await controller.findAll(query, mockRequest as any);

      expect(mockTicketsService.findAll).toHaveBeenCalledWith(userId, query);
    });
  });

  describe('createComment', () => {
    const ticketId = 'ticket-123';
    const userId = 'user-123';
    const createCommentDto = { content: 'This is a test comment' };

    const mockRequest = {
      user: { id: userId },
    };

    const mockResponse = {
      message: 'Comment created successfully',
      comment: {
        id: 'comment-123',
        content: createCommentDto.content,
        ticketId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          username: 'testuser',
          email: 'test@example.com',
        },
      },
    };

    it('should successfully create a comment', async () => {
      mockTicketsService.createComment.mockResolvedValue(mockResponse);

      const result = await controller.createComment(
        ticketId,
        createCommentDto,
        mockRequest as any,
      );

      expect(result).toEqual(mockResponse);
      expect(mockTicketsService.createComment).toHaveBeenCalledWith(
        ticketId,
        createCommentDto.content,
        userId,
      );
    });
  });

  describe('getComments', () => {
    const ticketId = 'ticket-123';
    const userId = 'user-123';

    const mockRequest = {
      user: { id: userId },
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
        },
      },
    ];

    it('should return comments for a ticket', async () => {
      mockTicketsService.getComments.mockResolvedValue(mockComments);

      const result = await controller.getComments(ticketId, mockRequest as any);

      expect(result).toEqual(mockComments);
      expect(mockTicketsService.getComments).toHaveBeenCalledWith(
        ticketId,
        userId,
      );
    });
  });
});
