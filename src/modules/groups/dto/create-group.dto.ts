import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GroupType } from '../group.enums';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  espaceId!: string;

  @IsEnum(GroupType, { message: 'Type de groupe invalide' })
  type!: GroupType;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}