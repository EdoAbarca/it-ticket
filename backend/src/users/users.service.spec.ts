import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      isAdmin: false,
    };

    it('should create a new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const createdUser = {
        id: mockUser.id,
        username: createUserDto.username,
        email: createUserDto.email,
        isAdmin: createUserDto.isAdmin,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual({
        message: 'User created successfully',
        user: createdUser,
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create an admin user when isAdmin is true', async () => {
      const adminDto = { ...createUserDto, isAdmin: true };
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const createdAdmin = {
        id: mockUser.id,
        username: adminDto.username,
        email: adminDto.email,
        isAdmin: true,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      mockPrismaService.user.create.mockResolvedValue(createdAdmin);

      const result = await service.create(adminDto);

      expect(result.user.isAdmin).toBe(true);
    });
  });

  describe('findAll', () => {
    const mockUsers = [
      {
        id: '1',
        username: 'user1',
        email: 'user1@example.com',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        username: 'user2',
        email: 'user2@example.com',
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return paginated users with default parameters', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(2);

      const result = await service.findAll({});

      expect(result.users).toEqual(mockUsers);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });

    it('should return paginated users with custom parameters', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      mockPrismaService.user.count.mockResolvedValue(2);

      const result = await service.findAll({
        page: 2,
        limit: 1,
        sortBy: 'username',
        order: 'asc',
      });

      expect(result.users).toEqual([mockUsers[0]]);
      expect(result.pagination.page).toBe(2);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 1,
        take: 1,
        orderBy: { username: 'asc' },
        select: expect.any(Object),
      });
    });

    it('should throw BadRequestException if page is less than 1', async () => {
      await expect(service.findAll({ page: 0 })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findAll({ page: 0 })).rejects.toThrow(
        'Page must be greater than 0',
      );
    });

    it('should throw BadRequestException if limit is invalid', async () => {
      await expect(service.findAll({ limit: 0 })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findAll({ limit: 101 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userWithCounts = {
        ...mockUser,
        _count: {
          tickets: 5,
          comments: 10,
        },
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithCounts);

      const result = await service.findOne(mockUser.id);

      expect(result).toEqual(userWithCounts);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateUserDto = {
      username: 'updateduser',
      email: 'updated@example.com',
    };

    it('should update a user successfully', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const updatedUser = {
        ...mockUser,
        username: updateUserDto.username,
        email: updateUserDto.email,
      };
      delete updatedUser.password;

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateUserDto);

      expect(result).toEqual({
        message: 'User updated successfully',
        user: updatedUser,
      });
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if updated username already exists', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: 'different-id' });

      await expect(
        service.update(mockUser.id, { username: 'taken' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if updated email already exists', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: 'different-id' });

      await expect(
        service.update(mockUser.id, { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password when updating password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newhashedpassword');

      const updatedUser = { ...mockUser };
      delete updatedUser.password;
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      await service.update(mockUser.id, { password: 'newpassword' });

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    });

    it('should update isAdmin status', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const updatedUser = { ...mockUser, isAdmin: true };
      delete updatedUser.password;
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, { isAdmin: true });

      expect(result.user.isAdmin).toBe(true);
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove(mockUser.id);

      expect(result).toEqual({
        message: 'User deleted successfully',
      });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
