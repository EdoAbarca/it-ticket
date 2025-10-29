import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comment content is required' })
  content: string;
}
