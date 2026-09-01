import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../message-type.enum';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;
}