import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with valid token', async () => {
      const email = 'test@example.com';
      const resetToken = 'test-token-123';

      // Mock the transporter sendMail method
      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockResolvedValue({ messageId: 'test-message-id' } as any);

      await service.sendPasswordResetEmail(email, resetToken);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Password Reset Request',
          from: expect.any(String),
          html: expect.stringContaining(resetToken),
        }),
      );
    });

    it('should throw error when email sending fails', async () => {
      const email = 'test@example.com';
      const resetToken = 'test-token-123';

      jest
        .spyOn(service['transporter'], 'sendMail')
        .mockRejectedValue(new Error('SMTP error'));

      await expect(
        service.sendPasswordResetEmail(email, resetToken),
      ).rejects.toThrow('Failed to send password reset email');
    });
  });

  describe('sendPasswordResetConfirmationEmail', () => {
    it('should send password reset confirmation email', async () => {
      const email = 'test@example.com';

      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockResolvedValue({ messageId: 'test-message-id' } as any);

      await service.sendPasswordResetConfirmationEmail(email);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Password Successfully Reset',
          from: expect.any(String),
        }),
      );
    });

    it('should not throw error when confirmation email fails', async () => {
      const email = 'test@example.com';

      jest
        .spyOn(service['transporter'], 'sendMail')
        .mockRejectedValue(new Error('SMTP error'));

      // Should not throw
      await expect(
        service.sendPasswordResetConfirmationEmail(email),
      ).resolves.not.toThrow();
    });
  });
});
