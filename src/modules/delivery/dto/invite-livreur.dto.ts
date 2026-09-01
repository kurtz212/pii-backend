import { IsNotEmpty, IsString } from 'class-validator';

export class InviteLivreurDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;
}