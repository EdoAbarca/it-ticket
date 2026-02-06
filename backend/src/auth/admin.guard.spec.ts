import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access for admin users', async () => {
      const mockUser = { id: 'admin-123', isAdmin: true };
      const mockContext = createMockExecutionContext(mockUser);

      mockPrismaService.user.findUnique.mockResolvedValue({ isAdmin: true });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'admin-123' },
        select: { isAdmin: true },
      });
    });

    it('should deny access for non-admin users', async () => {
      const mockUser = { id: 'user-123', isAdmin: false };
      const mockContext = createMockExecutionContext(mockUser);

      mockPrismaService.user.findUnique.mockResolvedValue({ isAdmin: false });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Admin access required',
      );
    });

    it('should deny access when user is not found', async () => {
      const mockUser = { id: 'nonexistent-user' };
      const mockContext = createMockExecutionContext(mockUser);

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Admin access required',
      );
    });

    it('should deny access when user is not authenticated', async () => {
      const mockContext = createMockExecutionContext(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Access denied',
      );
    });

    it('should deny access when user id is missing', async () => {
      const mockUser = { username: 'testuser' };
      const mockContext = createMockExecutionContext(mockUser);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Access denied',
      );
    });
  });
});

function createMockExecutionContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as ExecutionContext;
}
