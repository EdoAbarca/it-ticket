import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { Priority, Status } from '@prisma/client';

describe('TicketsService', () => {
  let service: TicketsService;

  const mockPrismaService = {
    ticket: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
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

    it('should return all tickets for a user', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockTickets);
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
      });
    });

    it('should return tickets ordered by creation date descending', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue(mockTickets);

      await service.findAll(userId);

      expect(mockPrismaService.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'desc',
          },
        }),
      );
    });

    it('should return empty array if user has no tickets', async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
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
});
