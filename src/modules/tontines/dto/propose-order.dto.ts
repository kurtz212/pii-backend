import { IsInt, IsPositive } from 'class-validator';

export class ProposeOrderDto {
  @IsInt()
  @IsPositive()
  proposedOrder!: number;
}