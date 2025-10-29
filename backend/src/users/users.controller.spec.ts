import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const expectedResult = {
        message: 'User created successfully',
        user: mockUser,
      };

      mockUsersService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(expectedResult);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const query = { page: 1, limit: 10 };
      const expectedResult = {
        users: [mockUser],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockUsersService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(expectedResult);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto = { username: 'updateduser' };
      const expectedResult = {
        message: 'User updated successfully',
        user: { ...mockUser, username: 'updateduser' },
      };

      mockUsersService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(mockUser.id, updateUserDto);

      expect(result).toEqual(expectedResult);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateUserDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const expectedResult = {
        message: 'User deleted successfully',
      };

      mockUsersService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(mockUser.id);

      expect(result).toEqual(expectedResult);
      expect(mockUsersService.remove).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
