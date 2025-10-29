import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);

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
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: hashedPassword,
          }),
        }),
      );
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
});
