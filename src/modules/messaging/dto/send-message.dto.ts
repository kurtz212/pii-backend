import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../message-type.enum';

export class SendMessageDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}