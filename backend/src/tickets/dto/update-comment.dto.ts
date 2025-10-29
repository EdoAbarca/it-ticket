import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comment content is required' })
  @MinLength(1, { message: 'Comment cannot be empty' })
  content: string;
}
