import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const mockNotification = {
        id: '1',
        type: NotificationType.COMMENT,
        message: 'Test notification',
        ticketId: 'ticket-1',
        userId: 'user-1',
        commentId: 'comment-1',
        isRead: false,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.createNotification(
        'user-1',
        NotificationType.COMMENT,
        'Test notification',
        'ticket-1',
        'comment-1',
      );

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: NotificationType.COMMENT,
          message: 'Test notification',
          ticketId: 'ticket-1',
          commentId: 'comment-1',
        },
      });
    });
  });

  describe('getUserNotifications', () => {
    it('should get all notifications for a user', async () => {
      const mockNotifications = [
        {
          id: '1',
          type: NotificationType.COMMENT,
          message: 'Test notification 1',
          ticketId: 'ticket-1',
          userId: 'user-1',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );

      const result = await service.getUserNotifications('user-1', false);

      expect(result).toEqual(mockNotifications);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should get only unread notifications when unreadOnly is true', async () => {
      const mockNotifications = [
        {
          id: '1',
          type: NotificationType.COMMENT,
          message: 'Test notification 1',
          ticketId: 'ticket-1',
          userId: 'user-1',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );

      const result = await service.getUserNotifications('user-1', true);

      expect(result).toEqual(mockNotifications);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return the count of unread notifications', async () => {
      mockPrismaService.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsRead('notification-1', 'user-1');

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notification-1', userId: 'user-1' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for a user', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      await service.markAllAsRead('user-1');

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      mockPrismaService.notification.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteNotification('notification-1', 'user-1');

      expect(mockPrismaService.notification.deleteMany).toHaveBeenCalledWith({
        where: { id: 'notification-1', userId: 'user-1' },
      });
    });
  });
});
