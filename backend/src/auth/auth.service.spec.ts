import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockEmailService = {
    sendPasswordResetEmail: jest.fn(),
    sendPasswordResetConfirmationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test@1234',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: '1',
        username: registerDto.username,
        email: registerDto.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        message: 'User registered successfully',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: registerDto.username,
          email: registerDto.email,
          password: hashedPassword,
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should throw ConflictException if username already exists', async () => {
      const existingUser = {
        id: '1',
        username: registerDto.username,
        email: 'other@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        'Username already exists',
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: registerDto.username },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingUser = {
        id: '1',
        username: 'otheruser',
        email: registerDto.email,
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // username check passes
        .mockResolvedValueOnce(existingUser); // email check fails

      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already exists',
      );
    });

    it('should hash the password before storing', async () => {
      const hashedPassword = 'hashedPassword123';
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        username: registerDto.username,
        email: registerDto.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: registerDto.username,
          email: registerDto.email,
          password: hashedPassword,
        },
      });
    });

    it('should not return password in response', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        username: registerDto.username,
        email: registerDto.email,
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(registerDto);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toHaveProperty('username');
      expect(result.user).toHaveProperty('email');
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Test@1234',
    };

    const mockUser = {
      id: '1',
      username: 'testuser',
      email: loginDto.email,
      password: 'hashedPassword123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully login a user with valid credentials', async () => {
      const accessToken = 'jwt-token-123';

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        message: 'Login successful',
        accessToken,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    it('should not return password in response', async () => {
      const accessToken = 'jwt-token-123';

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await service.login(loginDto);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toHaveProperty('username');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('id');
    });

    it('should generate JWT token with correct payload', async () => {
      const accessToken = 'jwt-token-123';

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(accessToken);

      await service.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
    });
  });

  describe('logout', () => {
    it('should return success message', () => {
      const result = service.logout();

      expect(result).toEqual({
        message: 'Logout successful',
      });
    });
  });

  describe('requestPasswordReset', () => {
    const requestPasswordResetDto = {
      email: 'test@example.com',
    };

    const mockUser = {
      id: '1',
      username: 'testuser',
      email: requestPasswordResetDto.email,
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create reset token and send email for existing user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.passwordResetToken.create.mockResolvedValue({
        id: '1',
        token: 'hashed-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
        used: false,
      });

      const result = await service.requestPasswordReset(
        requestPasswordResetDto,
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: requestPasswordResetDto.email },
      });
      expect(mockPrismaService.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            token: expect.any(String),
            userId: mockUser.id,
            expiresAt: expect.any(Date),
          }),
        }),
      );
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        requestPasswordResetDto.email,
        expect.any(String),
      );
      expect(result.message).toContain('password reset link has been sent');
    });

    it('should not reveal if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset(
        requestPasswordResetDto,
      );

      expect(
        mockPrismaService.passwordResetToken.create,
      ).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(result.message).toContain('password reset link has been sent');
    });

    it('should set token expiration to 1 hour', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.passwordResetToken.create.mockResolvedValue({
        id: '1',
        token: 'hashed-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
        used: false,
      });

      const beforeCall = new Date();
      await service.requestPasswordReset(requestPasswordResetDto);
      const afterCall = new Date();

      const createCall =
        mockPrismaService.passwordResetToken.create.mock.calls[0][0];
      const expiresAt = createCall.data.expiresAt;

      // Check that expiration is approximately 1 hour from now
      const hourFromBefore = new Date(beforeCall);
      hourFromBefore.setHours(hourFromBefore.getHours() + 1);
      const hourFromAfter = new Date(afterCall);
      hourFromAfter.setHours(hourFromAfter.getHours() + 1);

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
        hourFromBefore.getTime() - 1000, // Allow 1 second tolerance
      );
      expect(expiresAt.getTime()).toBeLessThanOrEqual(
        hourFromAfter.getTime() + 1000, // Allow 1 second tolerance
      );
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      token: 'plain-token',
      newPassword: 'NewPass@123',
    };

    const mockResetToken = {
      id: '1',
      token: 'hashed-token',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      createdAt: new Date(),
      used: false,
      user: {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'oldHashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should reset password with valid token', async () => {
      const newHashedPassword = 'newHashedPassword';
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(
        mockResetToken,
      );
      (bcrypt.hash as jest.Mock).mockResolvedValue(newHashedPassword);
      mockPrismaService.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.resetPassword(resetPasswordDto);

      expect(
        mockPrismaService.passwordResetToken.findUnique,
      ).toHaveBeenCalledWith({
        where: { token: expect.any(String) },
        include: { user: true },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        resetPasswordDto.newPassword,
        10,
      );
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(
        mockEmailService.sendPasswordResetConfirmationEmail,
      ).toHaveBeenCalledWith(mockResetToken.user.email);
      expect(result.message).toContain('successfully reset');
    });

    it('should throw error if token not found', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid or expired reset token',
      );
    });

    it('should throw error if token has expired', async () => {
      const expiredToken = {
        ...mockResetToken,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      };
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(
        expiredToken,
      );

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid or expired reset token',
      );
    });

    it('should throw error if token has already been used', async () => {
      const usedToken = {
        ...mockResetToken,
        used: true,
      };
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(
        usedToken,
      );

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid or expired reset token',
      );
    });

    it('should mark token as used after successful reset', async () => {
      const newHashedPassword = 'newHashedPassword';
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(
        mockResetToken,
      );
      (bcrypt.hash as jest.Mock).mockResolvedValue(newHashedPassword);

      // Mock the transaction to capture the operations
      mockPrismaService.$transaction.mockImplementation((operations) => {
        return Promise.resolve(operations);
      });

      await service.resetPassword(resetPasswordDto);

      // Verify transaction was called
      expect(mockPrismaService.$transaction).toHaveBeenCalled();

      // Get the transaction operations
      const transactionCall = mockPrismaService.$transaction.mock.calls[0][0];
      expect(transactionCall).toHaveLength(2);
    });

    it('should hash new password before storing', async () => {
      const newHashedPassword = 'newHashedPassword';
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(
        mockResetToken,
      );
      (bcrypt.hash as jest.Mock).mockResolvedValue(newHashedPassword);
      mockPrismaService.$transaction.mockResolvedValue([{}, {}]);

      await service.resetPassword(resetPasswordDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        resetPasswordDto.newPassword,
        10,
      );
    });
  });
});
