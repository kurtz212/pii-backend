import { IsNotEmpty, IsString } from 'class-validator';

export class AssignLivreurDto {
  @IsString()
  @IsNotEmpty()
  livreurId!: string;
}