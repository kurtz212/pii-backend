import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsIn(['email', 'sms'])
  channel!: 'email' | 'sms';
}