import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrderAssignment {
  userId!: string;
  order!: number;
}

export class ProposeCalendarDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderAssignment)
  assignments!: OrderAssignment[];
}