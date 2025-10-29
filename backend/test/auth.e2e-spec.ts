import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    
    prismaService = app.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    const testUser = {
      email: 'login@test.com',
      password: 'Test@1234',
      username: 'loginuser',
    };

    beforeEach(async () => {
      // Clean up test user if exists
      await prismaService.user.deleteMany({
        where: { email: testUser.email },
      });

      // Create a test user for login
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await prismaService.user.create({
        data: {
          username: testUser.username,
          email: testUser.email,
          password: hashedPassword,
        },
      });
    });

    afterEach(async () => {
      // Clean up after each test
      await prismaService.user.deleteMany({
        where: { email: testUser.email },
      });
    });

    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Login successful');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', testUser.email);
          expect(res.body.user).toHaveProperty('username', testUser.username);
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should fail to login with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'wrong@test.com',
          password: testUser.password,
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should fail to login with invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword@123',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: testUser.password,
        })
        .expect(400);
    });

    it('should fail with missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
        })
        .expect(400);
    });

    it('should fail with missing email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: testUser.password,
        })
        .expect(400);
    });
  });
});
