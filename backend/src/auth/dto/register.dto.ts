import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  username: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message: 'Password must contain at least one special character',
  })
  password: string;
}
