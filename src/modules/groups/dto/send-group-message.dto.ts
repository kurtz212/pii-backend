import { IsNotEmpty, IsString } from 'class-validator';

export class SendGroupMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}