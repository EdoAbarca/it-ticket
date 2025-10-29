import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
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
});
