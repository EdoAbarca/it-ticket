import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteBackupDto {
  @IsString()
  @IsNotEmpty()
  filename: string;
}
