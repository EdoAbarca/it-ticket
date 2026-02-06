import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '@prisma/client';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockNotificationsService = {
    getUserNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  const mockRequest = {
    user: {
      userId: 'user-1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should return all notifications for a user', async () => {
      const mockNotifications = [
        {
          id: '1',
          type: NotificationType.COMMENT,
          message: 'Test notification',
          ticketId: 'ticket-1',
          userId: 'user-1',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockNotificationsService.getUserNotifications.mockResolvedValue(
        mockNotifications,
      );

      const result = await controller.getNotifications(mockRequest, {
        unreadOnly: false,
      });

      expect(result).toEqual({ notifications: mockNotifications });
      expect(
        mockNotificationsService.getUserNotifications,
      ).toHaveBeenCalledWith('user-1', false);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockNotificationsService.getUnreadCount.mockResolvedValue(3);

      const result = await controller.getUnreadCount(mockRequest);

      expect(result).toEqual({ count: 3 });
      expect(mockNotificationsService.getUnreadCount).toHaveBeenCalledWith(
        'user-1',
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      mockNotificationsService.markAsRead.mockResolvedValue(undefined);

      const result = await controller.markAsRead('notification-1', mockRequest);

      expect(result).toEqual({ message: 'Notification marked as read' });
      expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(
        'notification-1',
        'user-1',
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue(undefined);

      const result = await controller.markAllAsRead(mockRequest);

      expect(result).toEqual({ message: 'All notifications marked as read' });
      expect(mockNotificationsService.markAllAsRead).toHaveBeenCalledWith(
        'user-1',
      );
    });
  });
});
